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

    it('401 если pendingApproval=true (F-H2: единый ответ для anti-enumeration)', async () => {
        await User.create({
            login,
            password: await encrypt('pass1234'),
            name: 'P',
            role: 4,
            isActivated: true,
            pendingApproval: true,
        });
        const res = await request(app).post('/auth/login').send({ login, password: 'pass1234' });
        expect(res.status).toBe(401);
        expect(res.body.message || res.text).toMatch(/неверный логин или пароль/i);
    });

    it('200 если pendingApproval=false', async () => {
        await User.update({ pendingApproval: false }, { where: { login } });
        const res = await request(app).post('/auth/login').send({ login, password: 'pass1234' });
        expect(res.status).toBe(200);
    });
});
