import crypto from 'crypto';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import User from '../../src/models/user';
import { createAdminAuth, TestAdminAuth } from '../helpers/auth-helper';

describe('GET /users/pending-registrations', () => {
    const pendingLogin = 'p1@t.local';
    const adminFlowLogin = 'p1-adminflow@t.local';
    let admin: TestAdminAuth;

    beforeAll(async () => {
        await User.destroy({ where: { login: pendingLogin }, force: true });
        await User.destroy({ where: { login: adminFlowLogin }, force: true });
        // web-self-reg pending: !isActivated + pendingVerifyToken — должен попасть в выдачу.
        await User.create({
            login: pendingLogin,
            password: 'x',
            name: 'P1',
            role: 4,
            isActivated: false,
            pendingVerifyToken: crypto.createHash('sha256').update('plain-token').digest('hex'),
            pendingVerifyTokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });
        // admin-flow ждёт email-кода: !isActivated, но pendingVerifyToken=null.
        // НЕ должен попасть в выдачу — это другой workflow.
        await User.create({
            login: adminFlowLogin,
            password: 'x',
            name: 'P1 Admin',
            role: 3,
            isActivated: false,
        });
        admin = await createAdminAuth('admin-pending@t.local');
    });

    afterAll(async () => {
        await User.destroy({ where: { login: pendingLogin }, force: true });
        await User.destroy({ where: { login: adminFlowLogin }, force: true });
        await User.destroy({ where: { login: 'admin-pending@t.local' }, force: true });
    });

    it('401 без авторизации', async () => {
        const res = await request(app).get('/users/pending-registrations');
        expect(res.status).toBe(401);
    });

    it('возвращает только web-self-reg pending для ADMIN', async () => {
        const res = await request(app)
            .get('/users/pending-registrations')
            .set('Authorization', admin.authHeader)
            .set('Cookie', admin.cookie);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        const pending = res.body.find((u: any) => u.login === pendingLogin);
        expect(pending).toBeDefined();
        expect(pending.isActivated).toBe(false);
        // admin-flow юзеры (без pendingVerifyToken) сюда попадать не должны.
        const adminFlow = res.body.find((u: any) => u.login === adminFlowLogin);
        expect(adminFlow).toBeUndefined();
        // В выдаче не должно быть активированных пользователей.
        for (const u of res.body) {
            expect(u.isActivated).toBe(false);
        }
    });
});
