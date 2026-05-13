import crypto from 'crypto';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import User from '../../src/models/user';
import { encrypt } from '../../src/utils/encryption';

describe('POST /auth/login pending-gate', () => {
    const login = 'pending-login@test.local';

    beforeAll(async () => {
        await User.destroy({ where: { login }, force: true });
    });
    afterAll(async () => {
        await User.destroy({ where: { login }, force: true });
    });

    it('401 если web-self-reg pending (!isActivated && pendingVerifyToken) — F-H2 anti-enumeration', async () => {
        const tokenHash = crypto.createHash('sha256').update('plain-pending-token').digest('hex');
        await User.create({
            login,
            password: await encrypt('pass1234'),
            name: 'P',
            role: 4,
            isActivated: false,
            pendingVerifyToken: tokenHash,
            pendingVerifyTokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });
        const res = await request(app).post('/auth/login').send({ login, password: 'pass1234' });
        expect(res.status).toBe(401);
        expect(res.body.message || res.text).toMatch(/неверный логин или пароль/i);
    });

    it('200 после approve (isActivated=true, токен обнулён)', async () => {
        await User.update(
            { isActivated: true, pendingVerifyToken: null, pendingVerifyTokenExpiresAt: null },
            { where: { login } }
        );
        const res = await request(app).post('/auth/login').send({ login, password: 'pass1234' });
        expect(res.status).toBe(200);
    });

    it('200{userId} для admin-flow (!isActivated && pendingVerifyToken=null)', async () => {
        // Admin-flow юзер: создан менеджером, ждёт email-кода активации.
        // login отдаёт `{userId}` (incomplete) — фронт ведёт на /Activate.
        await User.update({ isActivated: false, pendingVerifyToken: null }, { where: { login } });
        const res = await request(app).post('/auth/login').send({ login, password: 'pass1234' });
        expect(res.status).toBe(200);
        expect(res.body.userId).toBeDefined();
        expect(res.body.accessToken).toBeUndefined();
    });
});
