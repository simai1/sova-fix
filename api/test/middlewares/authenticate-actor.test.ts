import cookieParser from 'cookie-parser';
import express from 'express';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import roles from '../../src/config/roles';
import errorHandler from '../../src/middlewares/errorHandler';
import {
    authenticateWebOrMaster,
    requireActorRoles,
    requireBotActor,
    requireWebActorRoles,
} from '../../src/middlewares/authenticate-actor';
import User from '../../src/models/user';
import jwtUtils from '../../src/utils/jwt';

const app = express();
app.use(cookieParser());
app.get('/actor', authenticateWebOrMaster, (req, res) => res.json(req.actor));
app.get('/shared-manager', authenticateWebOrMaster, requireActorRoles(roles.MANAGER), (_req, res) =>
    res.json({ ok: true })
);
app.get('/web-manager', authenticateWebOrMaster, requireWebActorRoles(roles.MANAGER), (_req, res) =>
    res.json({ ok: true })
);
app.get('/bot', authenticateWebOrMaster, requireBotActor, (_req, res) => res.json({ ok: true }));
app.use(errorHandler);

describe('authenticateWebOrMaster', () => {
    const login = `actor-middleware-${Date.now()}@test.local`;
    const testMasterKey = 'actor-middleware-test-master-key';
    const originalMasterKey = process.env.MASTER_API_KEY;
    let user: User;

    beforeAll(async () => {
        process.env.MASTER_API_KEY = testMasterKey;
        await User.destroy({ where: { login }, force: true });
        user = await User.create({
            login,
            password: 'x',
            name: 'Actor middleware user',
            role: roles.MANAGER,
            isActivated: true,
        });
    });

    beforeEach(async () => {
        await user.update({ role: roles.MANAGER });
    });

    afterAll(async () => {
        await User.destroy({ where: { login }, force: true });
        if (originalMasterKey === undefined) delete process.env.MASTER_API_KEY;
        else process.env.MASTER_API_KEY = originalMasterKey;
    });

    const authHeader = (tokenRole: number): string => {
        const { accessToken } = jwtUtils.generate({ id: user.id, role: tokenRole });
        return `Bearer ${accessToken}`;
    };

    it('загружает актуальную web-роль из БД, не доверяя роли JWT', async () => {
        const response = await request(app).get('/actor').set('Authorization', authHeader(roles.ADMIN));

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ kind: 'web', userId: user.id, role: roles.MANAGER });
    });

    it('передаёт ошибку загрузки User в error middleware', async () => {
        const findByPk = vi.spyOn(User, 'findByPk').mockRejectedValueOnce(new Error('database unavailable'));
        try {
            const response = await request(app).get('/actor').set('Authorization', authHeader(roles.MANAGER));
            expect(response.status).toBe(500);
        } finally {
            findByPk.mockRestore();
        }
    });

    it('принимает корректный непустой master key как bot actor', async () => {
        const response = await request(app).get('/actor').set('master-api-key', testMasterKey);

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ kind: 'bot' });
    });

    it('возвращает 401 без credentials', async () => {
        const response = await request(app).get('/actor');

        expect(response.status).toBe(401);
    });

    it('возвращает 401 для невалидного Bearer', async () => {
        const response = await request(app).get('/actor').set('Authorization', 'Bearer invalid-token');

        expect(response.status).toBe(401);
    });

    it('безопасно отклоняет master key другой длины', async () => {
        const response = await request(app).get('/actor').set('master-api-key', 'short');

        expect(response.status).toBe(401);
    });

    it('не принимает master key, если серверный ключ пуст', async () => {
        process.env.MASTER_API_KEY = '';
        try {
            const response = await request(app).get('/actor').set('master-api-key', testMasterKey);
            expect(response.status).toBe(401);
        } finally {
            process.env.MASTER_API_KEY = testMasterKey;
        }
    });

    it('пропускает bot через shared role gate', async () => {
        const response = await request(app).get('/shared-manager').set('master-api-key', testMasterKey);

        expect(response.status).toBe(200);
    });

    it('проверяет актуальную web-роль в shared role gate', async () => {
        const allowed = await request(app).get('/shared-manager').set('Authorization', authHeader(roles.ADMIN));
        await user.update({ role: roles.CUSTOMER });
        const forbidden = await request(app).get('/shared-manager').set('Authorization', authHeader(roles.MANAGER));

        expect(allowed.status).toBe(200);
        expect(forbidden.status).toBe(403);
    });

    it('web-only gate отклоняет bot actor', async () => {
        const response = await request(app).get('/web-manager').set('master-api-key', testMasterKey);

        expect(response.status).toBe(403);
    });

    it('bot-only gate принимает master и отклоняет web actor', async () => {
        const bot = await request(app).get('/bot').set('master-api-key', testMasterKey);
        const web = await request(app).get('/bot').set('Authorization', authHeader(roles.MANAGER));

        expect(bot.status).toBe(200);
        expect(web.status).toBe(403);
    });
});
