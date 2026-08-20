import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import User from '../../src/models/user';
import TgUser from '../../src/models/tgUser';
import Contractor from '../../src/models/contractor';
import TokenModel from '../../src/models/token-model';
import PushSubscription from '../../src/models/pushSubscription';
import roles from '../../src/config/roles';
import { encrypt } from '../../src/utils/encryption';
import { createAdminAuth, createManagerAuth, TestAdminAuth } from '../helpers/auth-helper';
import { createUserAuth, TestAuth } from '../helpers/lk-helper';

const ADMIN_LOGIN = 'admin-disable@t.local';
const MANAGER_LOGIN = 'manager-disable@t.local';
const TARGET_LOGIN = 'target-disable@t.local';
const TARGET_PASSWORD = 'Str0ngPass!';

const disableUrl = (userId: string) => `/users/${userId}/disable`;

describe('PATCH /users/:userId/disable', () => {
    let admin: TestAdminAuth;
    let manager: TestAdminAuth;
    let target: TestAuth;

    const patch = (userId: string, disabled: boolean, auth: TestAdminAuth | TestAuth = admin) =>
        request(app)
            .patch(disableUrl(userId))
            .set('Authorization', auth.authHeader)
            .set('Cookie', auth.cookie)
            .send({ disabled });

    beforeAll(async () => {
        admin = await createAdminAuth(ADMIN_LOGIN);
        manager = await createManagerAuth(MANAGER_LOGIN);
    });

    beforeEach(async () => {
        target = await createUserAuth(TARGET_LOGIN, roles.CUSTOMER, 'Target User');
        await target.user.update({ password: await encrypt(TARGET_PASSWORD), isDisabled: false });
    });

    afterAll(async () => {
        for (const login of [ADMIN_LOGIN, MANAGER_LOGIN, TARGET_LOGIN]) {
            const user = await User.findOne({ where: { login }, paranoid: false });
            if (!user) continue;
            await TokenModel.destroy({ where: { userId: user.id }, force: true });
            await PushSubscription.destroy({ where: { userId: user.id }, force: true });
            await User.destroy({ where: { id: user.id }, force: true });
        }
    });

    it('403 для не-администратора', async () => {
        const res = await patch(target.user.id, true, manager);
        expect(res.status).toBe(403);
        await target.user.reload();
        expect(target.user.isDisabled).toBe(false);
    });

    it('400 при попытке отключить самого себя', async () => {
        const res = await patch(admin.user.id, true);
        expect(res.status).toBe(400);
        expect(res.body.message).toContain('собственный доступ');
    });

    it('400 при отключении TG-аккаунта, привязанного к самому админу', async () => {
        const tgUser = await TgUser.create({
            name: 'Admin Tg',
            role: 2,
            tgId: `disable-self-tg-${Date.now()}`,
            isConfirmed: true,
        });
        await admin.user.update({ tgManagerId: tgUser.id });

        const res = await patch(tgUser.id, true);
        expect(res.status).toBe(400);

        await admin.user.reload();
        await tgUser.reload();
        expect(admin.user.isDisabled).toBe(false);
        expect(tgUser.isDisabled).toBe(false);

        await admin.user.update({ tgManagerId: null });
        await TgUser.destroy({ where: { id: tgUser.id }, force: true });
    });

    it('проставляет is_disabled, disabled_at и disabled_by', async () => {
        const res = await patch(target.user.id, true);
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ id: target.user.id, isDisabled: true });

        await target.user.reload();
        expect(target.user.isDisabled).toBe(true);
        expect(target.user.disabledAt).toBeInstanceOf(Date);
        expect(target.user.disabledBy).toBe(admin.user.id);
    });

    it('отключённый не может войти', async () => {
        await patch(target.user.id, true);
        const res = await request(app).post('/auth/login').send({ login: TARGET_LOGIN, password: TARGET_PASSWORD });
        expect(res.status).toBe(401);
        expect(res.body.message).toContain('отключён');
    });

    it('рвёт refresh-сессию: строка в token-model удалена, /auth/refresh → 401', async () => {
        expect(await TokenModel.count({ where: { userId: target.user.id } })).toBe(1);

        await patch(target.user.id, true);

        expect(await TokenModel.count({ where: { userId: target.user.id } })).toBe(0);
        const res = await request(app).get('/auth/refresh').set('Cookie', target.cookie);
        expect(res.status).toBe(401);
    });

    it('удаляет push-подписки', async () => {
        await PushSubscription.create({
            userId: target.user.id,
            endpoint: `https://fcm.googleapis.com/fcm/send/${target.user.id}`,
            p256dhKey: 'k',
            authKey: 'a',
        } as any);
        expect(await PushSubscription.count({ where: { userId: target.user.id } })).toBe(1);

        await patch(target.user.id, true);
        expect(await PushSubscription.count({ where: { userId: target.user.id } })).toBe(0);
    });

    it('живой access-токен отключённого больше не пускает в API', async () => {
        const before = await request(app)
            .get('/users')
            .set('Authorization', target.authHeader)
            .set('Cookie', target.cookie);
        expect(before.status).toBe(200);

        await patch(target.user.id, true);

        const after = await request(app)
            .get('/users')
            .set('Authorization', target.authHeader)
            .set('Cookie', target.cookie);
        expect(after.status).toBe(401);
        expect(after.body.message).toContain('отключён');
    });

    it('включение обратно возвращает доступ', async () => {
        await patch(target.user.id, true);
        const res = await patch(target.user.id, false);
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ id: target.user.id, isDisabled: false });

        await target.user.reload();
        expect(target.user.isDisabled).toBe(false);
        expect(target.user.disabledAt).toBeNull();
        expect(target.user.disabledBy).toBeNull();

        const login = await request(app).post('/auth/login').send({ login: TARGET_LOGIN, password: TARGET_PASSWORD });
        expect(login.status).toBe(200);
    });

    it('отключение web-пользователя отключает и связанный TG-аккаунт', async () => {
        const tgUser = await TgUser.create({
            name: 'Linked Tg',
            role: 3,
            tgId: `disable-linked-${Date.now()}`,
            isConfirmed: true,
        });
        await target.user.update({ tgManagerId: tgUser.id });

        await patch(target.user.id, true);

        await tgUser.reload();
        expect(tgUser.isDisabled).toBe(true);

        await patch(target.user.id, false);
        await tgUser.reload();
        expect(tgUser.isDisabled).toBe(false);

        await target.user.update({ tgManagerId: null });
        await TgUser.destroy({ where: { id: tgUser.id }, force: true });
    });

    it('отключение TG-пользователя отключает и связанный web-аккаунт', async () => {
        const tgUser = await TgUser.create({
            name: 'Tg First',
            role: 3,
            tgId: `disable-tg-first-${Date.now()}`,
            isConfirmed: true,
        });
        await target.user.update({ tgManagerId: tgUser.id });

        const res = await patch(tgUser.id, true);
        expect(res.status).toBe(200);

        await tgUser.reload();
        await target.user.reload();
        expect(tgUser.isDisabled).toBe(true);
        expect(target.user.isDisabled).toBe(true);
        expect(await TokenModel.count({ where: { userId: target.user.id } })).toBe(0);

        await target.user.update({ tgManagerId: null });
        await TgUser.destroy({ where: { id: tgUser.id }, force: true });
    });

    it('отключённый исполнитель пропадает из GET /contractors, ответ остаётся 200', async () => {
        const contractorLogin = 'contractor-disable@t.local';
        const contractorAuth = await createUserAuth(contractorLogin, roles.CONTRACTOR, 'Disabled Contractor');
        const contractor = await Contractor.create({ userId: contractorAuth.user.id });

        const before = await request(app)
            .get('/contractors')
            .set('Authorization', admin.authHeader)
            .set('Cookie', admin.cookie);
        expect(before.status).toBe(200);
        expect(before.body.some((c: { id: string }) => c.id === contractor.id)).toBe(true);

        await patch(contractorAuth.user.id, true);

        const after = await request(app)
            .get('/contractors')
            .set('Authorization', admin.authHeader)
            .set('Cookie', admin.cookie);
        expect(after.status).toBe(200);
        expect(after.body.some((c: { id: string }) => c.id === contractor.id)).toBe(false);

        await Contractor.destroy({ where: { id: contractor.id }, force: true });
        await TokenModel.destroy({ where: { userId: contractorAuth.user.id }, force: true });
        await User.destroy({ where: { id: contractorAuth.user.id }, force: true });
    });

    it('работает для каждой веб-роли', async () => {
        for (const role of [roles.ADMIN, roles.CUSTOMER, roles.CONTRACTOR, roles.OBSERVER, roles.MANAGER]) {
            const login = `role-${role}-disable@t.local`;
            const auth = await createUserAuth(login, role, `Role ${role}`);

            const off = await patch(auth.user.id, true);
            expect(off.status, `отключение роли ${role}`).toBe(200);
            await auth.user.reload();
            expect(auth.user.isDisabled).toBe(true);

            const on = await patch(auth.user.id, false);
            expect(on.status, `включение роли ${role}`).toBe(200);
            await auth.user.reload();
            expect(auth.user.isDisabled).toBe(false);

            await TokenModel.destroy({ where: { userId: auth.user.id }, force: true });
            await User.destroy({ where: { id: auth.user.id }, force: true });
        }
    });
});
