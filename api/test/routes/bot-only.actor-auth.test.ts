import cookieParser from 'cookie-parser';
import express from 'express';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

vi.mock('../../src/services/email.service', () => ({ default: vi.fn() }));

import app from '../../src/app';
import roles from '../../src/config/roles';
import errorHandler from '../../src/middlewares/errorHandler';
import verifyAnyRole from '../../src/middlewares/verify-any-role';
import verifyRole from '../../src/middlewares/verify-role';
import verifyToken from '../../src/middlewares/verify-token';
import Contractor from '../../src/models/contractor';
import ObjectDir from '../../src/models/object';
import TgUser from '../../src/models/tgUser';
import TgUserObject from '../../src/models/tgUserObject';
import User from '../../src/models/user';
import jwtUtils from '../../src/utils/jwt';
import { createManagerAuth, TestAdminAuth } from '../helpers/auth-helper';
import { cleanupByLogin, ensureBaseRefs } from '../helpers/lk-helper';

const roleApp = express();
roleApp.use(cookieParser());
roleApp.get('/exact', verifyToken.auth, verifyRole(roles.MANAGER), (_req, res) => res.json({ ok: true }));
roleApp.get('/any', verifyToken.auth, verifyAnyRole(['MANAGER']), (_req, res) => res.json({ ok: true }));
roleApp.use(errorHandler);

describe('legacy role middleware с Bearer actor', () => {
    const login = `legacy-role-${Date.now()}@test.local`;
    let user: User;

    beforeAll(async () => {
        await User.destroy({ where: { login }, force: true });
        user = await User.create({
            login,
            password: 'x',
            name: 'Legacy role user',
            role: roles.MANAGER,
            isActivated: true,
        });
    });

    beforeEach(async () => {
        await user.update({ role: roles.MANAGER });
    });

    afterAll(async () => {
        await User.destroy({ where: { login }, force: true });
    });

    const authHeader = (tokenRole: number): string => {
        const { accessToken } = jwtUtils.generate({ id: user.id, role: tokenRole });
        return `Bearer ${accessToken}`;
    };

    it('verifyRole и verifyAnyRole работают по Bearer без refresh cookie', async () => {
        const header = authHeader(roles.ADMIN);
        const exact = await request(roleApp).get('/exact').set('Authorization', header);
        const any = await request(roleApp).get('/any').set('Authorization', header);

        expect(exact.status).toBe(200);
        expect(any.status).toBe(200);
    });

    it('verifyRole и verifyAnyRole отклоняют устаревшую разрешённую роль из JWT', async () => {
        const header = authHeader(roles.MANAGER);
        await user.update({ role: roles.CUSTOMER });
        const exact = await request(roleApp).get('/exact').set('Authorization', header);
        const any = await request(roleApp).get('/any').set('Authorization', header);

        expect(exact.status).toBe(403);
        expect(any.status).toBe(403);
    });
});

describe('bot-only actor routes', () => {
    const testMasterKey = 'bot-routes-test-master-key';
    const originalMasterKey = process.env.MASTER_API_KEY;
    const managerLogin = `bot-routes-manager-${Date.now()}@test.local`;
    const deniedCrmLogin = `bot-routes-denied-${Date.now()}@test.local`;
    const allowedCrmLogin = `bot-routes-allowed-${Date.now()}@test.local`;
    const fixtureTgId = `bot-routes-fixture-${Date.now()}`;
    const deniedTgId = `bot-routes-denied-${Date.now()}`;
    const allowedTgId = `bot-routes-allowed-${Date.now()}`;
    let manager: TestAdminAuth;
    let fixtureTgUser: TgUser;
    let fixtureContractor: Contractor;
    let fixtureObject: ObjectDir;

    beforeAll(async () => {
        process.env.MASTER_API_KEY = testMasterKey;
        for (const login of [managerLogin, deniedCrmLogin, allowedCrmLogin]) await cleanupByLogin(login);
        await TgUser.destroy({ where: { tgId: [fixtureTgId, deniedTgId, allowedTgId] }, force: true });
        manager = await createManagerAuth(managerLogin);
        fixtureTgUser = await TgUser.create({
            name: 'Bot route fixture',
            role: roles.CONTRACTOR,
            tgId: fixtureTgId,
            isConfirmed: true,
        });
        fixtureContractor = await Contractor.create({ tgUserId: fixtureTgUser.id });
        const { legal, unit } = await ensureBaseRefs();
        fixtureObject = await ObjectDir.create({
            name: `Bot actor route object ${Date.now()}`,
            unitId: unit.id,
            legalEntityId: legal.id,
            city: 'Москва',
            number: 0,
        } as any);
        await TgUserObject.create({ tgUserId: fixtureTgUser.id, objectId: fixtureObject.id });
    });

    afterAll(async () => {
        for (const login of [managerLogin, deniedCrmLogin, allowedCrmLogin]) await cleanupByLogin(login);
        await TgUserObject.destroy({ where: { tgUserId: fixtureTgUser.id }, force: true });
        await Contractor.destroy({ where: { id: fixtureContractor.id }, force: true });
        await TgUser.destroy({ where: { tgId: [fixtureTgId, deniedTgId, allowedTgId] }, force: true });
        await ObjectDir.destroy({ where: { id: fixtureObject.id }, force: true });
        if (originalMasterKey === undefined) delete process.env.MASTER_API_KEY;
        else process.env.MASTER_API_KEY = originalMasterKey;
    });

    it('отклоняет Manager на всех bot-only маршрутах', async () => {
        const registerCrm = await request(app)
            .post('/auth/registerCustomerCrm')
            .set('Authorization', manager.authHeader)
            .send({ login: deniedCrmLogin, user_id: fixtureTgId });
        const createTgUser = await request(app)
            .post('/tgUsers')
            .set('Authorization', manager.authHeader)
            .send({ name: 'Denied bot route user', role: roles.CUSTOMER, tgId: deniedTgId });
        const managerCount = await request(app)
            .get(`/tgUsers/${fixtureTgUser.id}/manager/count`)
            .set('Authorization', manager.authHeader);
        const contractorCount = await request(app)
            .get(`/tgUsers/${fixtureTgUser.id}/contractor/count`)
            .set('Authorization', manager.authHeader);

        expect(registerCrm.status).toBe(403);
        expect(createTgUser.status).toBe(403);
        expect(managerCount.status).toBe(403);
        expect(contractorCount.status).toBe(403);
    });

    it('master actor создаёт CRM customer', async () => {
        const response = await request(app)
            .post('/auth/registerCustomerCrm')
            .set('master-api-key', testMasterKey)
            .send({ login: allowedCrmLogin, user_id: fixtureTgId });

        expect(response.status).toBe(200);
        expect(response.body.login).toBe(allowedCrmLogin);
        expect(await User.findOne({ where: { login: allowedCrmLogin } })).not.toBeNull();
    });

    it('master actor создаёт Telegram user', async () => {
        const response = await request(app)
            .post('/tgUsers')
            .set('master-api-key', testMasterKey)
            .send({ name: 'Allowed bot route user', role: roles.CUSTOMER, tgId: allowedTgId });

        expect(response.status).toBe(200);
        expect(await TgUser.findOne({ where: { tgId: allowedTgId } })).not.toBeNull();
    });

    it('master actor читает bot-only aggregates', async () => {
        const managerCount = await request(app)
            .get(`/tgUsers/${fixtureTgUser.id}/manager/count`)
            .set('master-api-key', testMasterKey);
        const contractorCount = await request(app)
            .get(`/tgUsers/${fixtureTgUser.id}/contractor/count`)
            .set('master-api-key', testMasterKey);

        expect(managerCount.status).toBe(200);
        expect(managerCount.body).toEqual([expect.objectContaining({ id: fixtureObject.id })]);
        expect(contractorCount.status).toBe(200);
        expect(contractorCount.body).toEqual([expect.objectContaining({ id: fixtureObject.id })]);
    });

    it('оставляет GET /tgUsers и /tgUsers/managers публичными', async () => {
        const all = await request(app).get('/tgUsers');
        const managers = await request(app).get('/tgUsers/managers');

        expect(all.status).toBe(200);
        expect(managers.status).toBe(200);
    });
});
