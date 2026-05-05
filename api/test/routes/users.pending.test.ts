import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import User from '../../src/models/user';
import { createAdminAuth, TestAdminAuth } from '../helpers/auth-helper';

describe('GET /users/pending-registrations', () => {
    const pendingLogin = 'p1@t.local';
    let admin: TestAdminAuth;

    beforeAll(async () => {
        await User.destroy({ where: { login: pendingLogin }, force: true });
        await User.create({
            login: pendingLogin,
            password: 'x',
            name: 'P1',
            role: 4,
            isActivated: true,
            pendingApproval: true,
        });
        admin = await createAdminAuth('admin-pending@t.local');
    });

    afterAll(async () => {
        await User.destroy({ where: { login: pendingLogin }, force: true });
        await User.destroy({ where: { login: 'admin-pending@t.local' }, force: true });
    });

    it('401 без авторизации', async () => {
        const res = await request(app).get('/users/pending-registrations');
        expect(res.status).toBe(401);
    });

    it('возвращает только pending для ADMIN', async () => {
        const res = await request(app)
            .get('/users/pending-registrations')
            .set('Authorization', admin.authHeader)
            .set('Cookie', admin.cookie);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        const pending = res.body.find((u: any) => u.login === pendingLogin);
        expect(pending).toBeDefined();
        expect(pending.pendingApproval).toBe(true);
        // в выдаче не должно быть подтверждённых пользователей
        for (const u of res.body) {
            expect(u.pendingApproval).toBe(true);
        }
    });
});
