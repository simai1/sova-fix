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

    it('403 если pendingApproval=true', async () => {
        await User.create({
            login,
            password: await encrypt('pass1234'),
            name: 'P',
            role: 4,
            isActivated: true,
            pendingApproval: true,
        });
        const res = await request(app).post('/auth/login').send({ login, password: 'pass1234' });
        expect(res.status).toBe(403);
        expect(res.body.message || res.text).toMatch(/не подтверждена/i);
    });

    it('200 если pendingApproval=false', async () => {
        await User.update({ pendingApproval: false }, { where: { login } });
        const res = await request(app).post('/auth/login').send({ login, password: 'pass1234' });
        expect(res.status).toBe(200);
    });
});
