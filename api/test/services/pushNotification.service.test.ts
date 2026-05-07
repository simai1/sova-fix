import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import webpush from 'web-push';
import PushSubscription from '../../src/models/pushSubscription';
import { createUserAuth, cleanupByLogin, ensureBaseRefs, TestAuth } from '../helpers/lk-helper';
import roles from '../../src/config/roles';

// vi.spyOn по умолчанию работает с реальным модулем — это удобно для web-push,
// потому что нам нужно мокать только sendNotification и не трогать
// generateVAPIDKeys/setVapidDetails (их вызывает сам сервис).
const sendSpy = vi.spyOn(webpush, 'sendNotification');

// pushNotification.service кешит флаг конфигурации в module-state по env-snapshot;
// ставим VAPID-ключи ДО первого импорта сервиса.
beforeAll(async () => {
    const keys = webpush.generateVAPIDKeys();
    process.env.VAPID_PUBLIC_KEY = keys.publicKey;
    process.env.VAPID_PRIVATE_KEY = keys.privateKey;
    process.env.VAPID_SUBJECT = 'mailto:svc-test@sova-fix.example';
});

describe('pushNotificationService.sendToUsers', () => {
    const meLogin = 'lk-push-svc@t.local';
    let me: TestAuth;
    let pushService: typeof import('../../src/services/pushNotification.service').default;

    beforeAll(async () => {
        await ensureBaseRefs();
        await cleanupByLogin(meLogin);
        me = await createUserAuth(meLogin, roles.CONTRACTOR, 'Push Svc');

        // Динамический импорт после установки env'ов — иначе ensureWebPushConfigured
        // увидит пустой VAPID и закешит false.
        pushService = (await import('../../src/services/pushNotification.service')).default;
    });

    afterAll(async () => {
        await PushSubscription.destroy({ where: { userId: me.user.id }, force: true });
        await cleanupByLogin(meLogin);
        sendSpy.mockRestore();
    });

    beforeEach(async () => {
        await PushSubscription.destroy({ where: { userId: me.user.id }, force: true });
        sendSpy.mockReset();
    });

    const seed = async (n: number): Promise<PushSubscription[]> => {
        const arr: PushSubscription[] = [];
        for (let i = 0; i < n; i++) {
            arr.push(
                await PushSubscription.create({
                    userId: me.user.id,
                    endpoint: `https://fcm.googleapis.com/fcm/send/svc-${Date.now()}-${i}-${Math.random().toString(36).slice(2)}`,
                    p256dhKey: 'p'.repeat(80),
                    authKey: 'a'.repeat(20),
                    lastSeenAt: new Date(0),
                    failureCount: 0,
                } as any)
            );
        }
        return arr;
    };

    it('fan-out: sendNotification вызывается на каждую подписку', async () => {
        await seed(2);
        sendSpy.mockResolvedValue({ statusCode: 201, body: '', headers: {} });

        await pushService.sendToUsers([me.user.id], {
            title: 'sova-fix',
            body: 'тест',
            url: '/lk/',
        });

        expect(sendSpy).toHaveBeenCalledTimes(2);
    });

    it('successe lastSeenAt обновляется и failureCount сбрасывается', async () => {
        const [sub] = await seed(1);
        const oldLastSeen = sub.lastSeenAt;
        await sub.update({ failureCount: 3 });

        sendSpy.mockResolvedValue({ statusCode: 201, body: '', headers: {} });

        await pushService.sendToUsers([me.user.id], {
            title: 'sova-fix',
            body: 'тест',
        });

        const fresh = await PushSubscription.findByPk(sub.id);
        expect(fresh).not.toBeNull();
        expect(fresh!.failureCount).toBe(0);
        expect(fresh!.lastSeenAt.getTime()).toBeGreaterThan(oldLastSeen.getTime());
    });

    it('statusCode=410 → подписка destroy', async () => {
        const [sub] = await seed(1);

        // web-push кидает WebPushError с числовым statusCode на не-200 ответ.
        const err = new webpush.WebPushError('gone', 410, {}, '', sub.endpoint);
        sendSpy.mockRejectedValue(err);

        await pushService.sendToUsers([me.user.id], {
            title: 'sova-fix',
            body: 'тест',
        });

        const fresh = await PushSubscription.findByPk(sub.id);
        expect(fresh).toBeNull();
    });

    it('statusCode=500 → failureCount++; на 5-й попытке destroy', async () => {
        const [sub] = await seed(1);

        const err = new webpush.WebPushError('server error', 500, {}, '', sub.endpoint);
        sendSpy.mockRejectedValue(err);

        for (let i = 0; i < 4; i++) {
            await pushService.sendToUsers([me.user.id], { title: 'sova-fix', body: 'тест' });
        }
        const after4 = await PushSubscription.findByPk(sub.id);
        expect(after4).not.toBeNull();
        expect(after4!.failureCount).toBe(4);

        // 5-я попытка — destroy.
        await pushService.sendToUsers([me.user.id], { title: 'sova-fix', body: 'тест' });
        const after5 = await PushSubscription.findByPk(sub.id);
        expect(after5).toBeNull();
    });
});
