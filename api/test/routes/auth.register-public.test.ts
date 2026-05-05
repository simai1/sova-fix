import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import User from '../../src/models/user';

describe('POST /auth/register-public', () => {
    const login = 'newperformer@test.local';

    beforeEach(async () => {
        await User.destroy({ where: { login }, force: true });
    });

    it('создаёт User с pendingApproval=true и без токенов', async () => {
        const res = await request(app)
            .post('/auth/register-public')
            .send({ login, password: 'pass1234', name: 'P', role: 4 });
        expect(res.status).toBe(201);
        expect(res.body).toMatchObject({ login, name: 'P', role: 'CONTRACTOR' });
        expect(res.body.userId).toBeDefined();
        expect(res.body.accessToken).toBeUndefined();

        const u = await User.findOne({ where: { login } });
        expect(u?.pendingApproval).toBe(true);
        expect(u?.isActivated).toBe(true);
    });

    it('400 если email занят', async () => {
        await User.create({ login, password: 'x', name: 'P', role: 4 });
        const res = await request(app)
            .post('/auth/register-public')
            .send({ login, password: 'pass1234', name: 'P', role: 4 });
        expect(res.status).toBe(400);
        expect(res.body.message || res.text).toMatch(/уже зарегистрирован/i);
    });

    it('400 если роль не 3 и не 4', async () => {
        const res = await request(app)
            .post('/auth/register-public')
            .send({ login, password: 'pass1234', name: 'P', role: 2 });
        expect(res.status).toBe(400);
    });

    it('400 если пароль короткий', async () => {
        const res = await request(app)
            .post('/auth/register-public')
            .send({ login, password: '123', name: 'P', role: 4 });
        expect(res.status).toBe(400);
    });
});
