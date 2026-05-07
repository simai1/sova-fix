import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import webpush from 'web-push';
import app from '../../src/app';
import PushSubscription from '../../src/models/pushSubscription';
import { createUserAuth, ensureBaseRefs, cleanupByLogin, TestAuth } from '../helpers/lk-helper';
import roles from '../../src/config/roles';

// Web Push subscribe/unsubscribe/status — backend-flow.
// См. design-doc 2026-05-07-web-push-design.md §8.1.
describe('LK Web Push (VAPID, RFC 8292)', () => {
    const meLogin = 'lk-push-me@t.local';
    let me: TestAuth;
    let savedPublicKey: string | undefined;
    let savedPrivateKey: string | undefined;
    let savedSubject: string | undefined;

    // Корректный FCM-эндпоинт (из allowlist'а), валидный по uri-схеме (https).
    const buildFcmEndpoint = (suffix: string): string =>
        `https://fcm.googleapis.com/fcm/send/${'a'.repeat(40)}-${suffix}`;

    beforeAll(async () => {
        await ensureBaseRefs();
        await cleanupByLogin(meLogin);

        // Сохраняем оригинальные env'ы (могут быть выставлены в .env.test.local
        // у разных разработчиков по-разному).
        savedPublicKey = process.env.VAPID_PUBLIC_KEY;
        savedPrivateKey = process.env.VAPID_PRIVATE_KEY;
        savedSubject = process.env.VAPID_SUBJECT;

        // Генерим валидную VAPID-пару один раз на сьют (используется во всех
        // тестах кроме «без VAPID»).
        const keys = webpush.generateVAPIDKeys();
        process.env.VAPID_PUBLIC_KEY = keys.publicKey;
        process.env.VAPID_PRIVATE_KEY = keys.privateKey;
        process.env.VAPID_SUBJECT = 'mailto:test@sova-fix.example';

        me = await createUserAuth(meLogin, roles.CONTRACTOR, 'Push Me');
    });

    afterAll(async () => {
        await PushSubscription.destroy({ where: { userId: me.user.id }, force: true });
        await cleanupByLogin(meLogin);

        if (savedPublicKey === undefined) delete process.env.VAPID_PUBLIC_KEY;
        else process.env.VAPID_PUBLIC_KEY = savedPublicKey;
        if (savedPrivateKey === undefined) delete process.env.VAPID_PRIVATE_KEY;
        else process.env.VAPID_PRIVATE_KEY = savedPrivateKey;
        if (savedSubject === undefined) delete process.env.VAPID_SUBJECT;
        else process.env.VAPID_SUBJECT = savedSubject;
    });

    beforeEach(async () => {
        // Каждый it стартует с чистым набором подписок этого юзера.
        await PushSubscription.destroy({ where: { userId: me.user.id }, force: true });
    });

    it('POST /lk/me/push/subscribe c валидным endpoint+ключами → 201, запись в БД', async () => {
        const endpoint = buildFcmEndpoint('happy');
        const res = await request(app)
            .post('/lk/me/push/subscribe')
            .set('Authorization', me.authHeader)
            .set('Cookie', me.cookie)
            .send({
                endpoint,
                keys: { p256dh: 'a'.repeat(80), auth: 'b'.repeat(20) },
                expirationTime: null,
                userAgent: 'vitest/1.0',
            });
        expect(res.status).toBe(201);
        expect(res.body.subscribed).toBe(true);
        expect(typeof res.body.id).toBe('string');

        const found = await PushSubscription.findOne({ where: { endpoint } });
        expect(found).not.toBeNull();
        expect(found?.userId).toBe(me.user.id);
    });

    it('повторный subscribe того же endpoint → обновляет ключи, не создаёт дубль', async () => {
        const endpoint = buildFcmEndpoint('repeat');

        const r1 = await request(app)
            .post('/lk/me/push/subscribe')
            .set('Authorization', me.authHeader)
            .set('Cookie', me.cookie)
            .send({
                endpoint,
                keys: { p256dh: 'a'.repeat(80), auth: 'b'.repeat(20) },
            });
        expect(r1.status).toBe(201);

        const r2 = await request(app)
            .post('/lk/me/push/subscribe')
            .set('Authorization', me.authHeader)
            .set('Cookie', me.cookie)
            .send({
                endpoint,
                keys: { p256dh: 'c'.repeat(80), auth: 'd'.repeat(20) },
                userAgent: 'updated-ua',
            });
        expect(r2.status).toBe(201);
        expect(r2.body.id).toBe(r1.body.id);

        const all = await PushSubscription.findAll({ where: { userId: me.user.id } });
        expect(all.length).toBe(1);
        expect(all[0].p256dhKey).toBe('c'.repeat(80));
        expect(all[0].authKey).toBe('d'.repeat(20));
        expect(all[0].userAgent).toBe('updated-ua');
    });

    it('GET /lk/me/push/status → корректный count', async () => {
        // Без подписок.
        const r1 = await request(app)
            .get('/lk/me/push/status')
            .set('Authorization', me.authHeader)
            .set('Cookie', me.cookie);
        expect(r1.status).toBe(200);
        expect(r1.body).toEqual({ subscribed: false, count: 0 });

        // Создаём подписку напрямую через модель.
        await PushSubscription.create({
            userId: me.user.id,
            endpoint: buildFcmEndpoint('status-check'),
            p256dhKey: 'p'.repeat(80),
            authKey: 'a'.repeat(20),
            lastSeenAt: new Date(),
            failureCount: 0,
        } as any);

        const r2 = await request(app)
            .get('/lk/me/push/status')
            .set('Authorization', me.authHeader)
            .set('Cookie', me.cookie);
        expect(r2.status).toBe(200);
        expect(r2.body).toEqual({ subscribed: true, count: 1 });
    });

    it('DELETE /lk/me/push/subscribe несуществующего endpoint → 204 (идемпотентно)', async () => {
        const res = await request(app)
            .delete('/lk/me/push/subscribe')
            .set('Authorization', me.authHeader)
            .set('Cookie', me.cookie)
            .send({ endpoint: buildFcmEndpoint('never-was') });
        expect(res.status).toBe(204);
    });

    it('subscribe с не-https endpoint → 400', async () => {
        const res = await request(app)
            .post('/lk/me/push/subscribe')
            .set('Authorization', me.authHeader)
            .set('Cookie', me.cookie)
            .send({
                endpoint: `http://fcm.googleapis.com/fcm/send/${'a'.repeat(50)}`,
                keys: { p256dh: 'a'.repeat(80), auth: 'b'.repeat(20) },
            });
        expect(res.status).toBe(400);
    });

    it('subscribe с не-allowlisted host → 400', async () => {
        const res = await request(app)
            .post('/lk/me/push/subscribe')
            .set('Authorization', me.authHeader)
            .set('Cookie', me.cookie)
            .send({
                endpoint: `https://attacker.example.com/fcm/send/${'a'.repeat(50)}`,
                keys: { p256dh: 'a'.repeat(80), auth: 'b'.repeat(20) },
            });
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/недопустимый/i);
    });

    describe('без VAPID-ключей', () => {
        beforeEach(() => {
            delete process.env.VAPID_PUBLIC_KEY;
            delete process.env.VAPID_PRIVATE_KEY;
            delete process.env.VAPID_SUBJECT;
        });

        afterEach(() => {
            // Восстанавливаем для остальных тестов.
            const keys = webpush.generateVAPIDKeys();
            process.env.VAPID_PUBLIC_KEY = keys.publicKey;
            process.env.VAPID_PRIVATE_KEY = keys.privateKey;
            process.env.VAPID_SUBJECT = 'mailto:test@sova-fix.example';
        });

        it('subscribe без VAPID → 503', async () => {
            const res = await request(app)
                .post('/lk/me/push/subscribe')
                .set('Authorization', me.authHeader)
                .set('Cookie', me.cookie)
                .send({
                    endpoint: buildFcmEndpoint('no-vapid'),
                    keys: { p256dh: 'a'.repeat(80), auth: 'b'.repeat(20) },
                });
            expect(res.status).toBe(503);
        });

        it('GET /lk/me/push/vapid-public-key без VAPID → 503', async () => {
            const res = await request(app)
                .get('/lk/me/push/vapid-public-key')
                .set('Authorization', me.authHeader)
                .set('Cookie', me.cookie);
            expect(res.status).toBe(503);
        });
    });

    it('GET /lk/me/push/vapid-public-key c валидной конфигурацией → 200 + publicKey', async () => {
        const res = await request(app)
            .get('/lk/me/push/vapid-public-key')
            .set('Authorization', me.authHeader)
            .set('Cookie', me.cookie);
        expect(res.status).toBe(200);
        expect(typeof res.body.publicKey).toBe('string');
        expect(res.body.publicKey.length).toBeGreaterThan(40);
    });
});
