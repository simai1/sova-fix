import crypto from 'crypto';
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

    it('возвращает pendingVerifyToken, в БД лежит только sha256-хеш', async () => {
        const res = await request(app)
            .post('/auth/register-public')
            .send({ login, password: 'pass1234', name: 'P', role: 4 });
        expect(res.status).toBe(201);

        const plainToken = res.body.pendingVerifyToken;
        expect(typeof plainToken).toBe('string');
        // 32 байта рандома → 64 hex-символа.
        expect(plainToken).toMatch(/^[0-9a-f]{64}$/);
        expect(typeof res.body.pendingVerifyTokenExpiresAt).toBe('string');
        // Срок жизни — 24 часа; 23..25 — диапазон с запасом на CI-задержки.
        const expiresAtMs = new Date(res.body.pendingVerifyTokenExpiresAt).getTime();
        const diffH = (expiresAtMs - Date.now()) / 3_600_000;
        expect(diffH).toBeGreaterThan(23);
        expect(diffH).toBeLessThan(25);

        const u = await User.findOne({ where: { login } });
        expect(u?.pendingVerifyToken).toBeTruthy();
        // Plain в БД храниться не должен.
        expect(u?.pendingVerifyToken).not.toBe(plainToken);
        // Хранится именно sha256(plain).
        const expectedHash = crypto.createHash('sha256').update(plainToken).digest('hex');
        expect(u?.pendingVerifyToken).toBe(expectedHash);
        expect(u?.pendingVerifyTokenExpiresAt).toBeInstanceOf(Date);
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

    it('400 если пароль короче 8 символов (F-H4)', async () => {
        const res = await request(app)
            .post('/auth/register-public')
            .send({ login, password: '1234567', name: 'P', role: 4 });
        expect(res.status).toBe(400);
    });
});
