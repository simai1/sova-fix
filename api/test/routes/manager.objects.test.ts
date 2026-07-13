import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

vi.mock('../../src/services/email.service', () => ({ default: vi.fn() }));

import app from '../../src/app';
import roles from '../../src/config/roles';
import ObjectDir from '../../src/models/object';
import TgUser from '../../src/models/tgUser';
import TgUserObject from '../../src/models/tgUserObject';
import User from '../../src/models/user';
import UserObject from '../../src/models/userObject';
import { createAdminAuth, createManagerAuth, TestAdminAuth } from '../helpers/auth-helper';
import { cleanupByLogin, createUserAuth, ensureBaseRefs, TestAuth } from '../helpers/lk-helper';

describe('Manager object directory and request-object scope', () => {
    const suffix = `${process.pid}-${Date.now()}`;
    const masterKey = `manager-objects-master-${suffix}`;
    const previousMasterKey = process.env.MASTER_API_KEY;
    const logins = {
        admin: `manager-objects-admin-${suffix}@test.local`,
        manager: `manager-objects-manager-${suffix}@test.local`,
        emptyManager: `manager-objects-empty-${suffix}@test.local`,
        customer: `manager-objects-customer-${suffix}@test.local`,
        contractor: `manager-objects-contractor-${suffix}@test.local`,
        legacy: `manager-objects-legacy-${suffix}@test.local`,
    };
    let admin: TestAdminAuth;
    let manager: TestAdminAuth;
    let emptyManager: TestAdminAuth;
    let customer: TestAuth;
    let contractor: TestAuth;
    let assignedObject: ObjectDir;
    let foreignObject: ObjectDir;
    let legacyTgUser: TgUser;

    const ids = (body: Array<{ id: string }>): string[] => body.map(item => item.id);
    const asWeb = (auth: TestAdminAuth | TestAuth, url: string) =>
        request(app).get(url).set('Authorization', auth.authHeader);

    beforeAll(async () => {
        process.env.MASTER_API_KEY = masterKey;
        admin = await createAdminAuth(logins.admin);
        manager = await createManagerAuth(logins.manager);
        emptyManager = await createManagerAuth(logins.emptyManager);
        customer = await createUserAuth(logins.customer, roles.CUSTOMER, `Customer ${suffix}`);
        contractor = await createUserAuth(logins.contractor, roles.CONTRACTOR, `Contractor ${suffix}`);
        const { legal, unit } = await ensureBaseRefs();
        assignedObject = await ObjectDir.create({
            name: `Manager objects assigned ${suffix}`,
            unitId: unit.id,
            legalEntityId: legal.id,
            city: 'Москва',
            number: 0,
        } as ObjectDir);
        foreignObject = await ObjectDir.create({
            name: `Manager objects foreign ${suffix}`,
            unitId: unit.id,
            legalEntityId: legal.id,
            city: 'Москва',
            number: 0,
        } as ObjectDir);
        await UserObject.bulkCreate([
            { userId: manager.user.id, objectId: assignedObject.id },
            { userId: customer.user.id, objectId: assignedObject.id },
            { userId: contractor.user.id, objectId: foreignObject.id },
        ]);
        legacyTgUser = await TgUser.create({
            name: `Legacy objects ${suffix}`,
            role: 3,
            tgId: `legacy-objects-${suffix}`,
            isConfirmed: true,
        });
        await User.create({
            login: logins.legacy,
            password: 'x',
            name: `Legacy linked ${suffix}`,
            role: roles.CUSTOMER,
            isActivated: true,
            tgManagerId: legacyTgUser.id,
        });
        await TgUserObject.create({ tgUserId: legacyTgUser.id, objectId: assignedObject.id });
    });

    afterAll(async () => {
        await UserObject.destroy({
            where: { userId: [manager.user.id, emptyManager.user.id, customer.user.id, contractor.user.id] },
            force: true,
        });
        await TgUserObject.destroy({ where: { tgUserId: legacyTgUser.id }, force: true });
        await ObjectDir.destroy({ where: { id: [assignedObject.id, foreignObject.id] }, force: true });
        for (const login of Object.values(logins)) await cleanupByLogin(login);
        await TgUser.destroy({ where: { id: legacyTgUser.id }, force: true });
        if (previousMasterKey === undefined) delete process.env.MASTER_API_KEY;
        else process.env.MASTER_API_KEY = previousMasterKey;
    });

    it('оставляет Менеджеру полный административный справочник объектов', async () => {
        const response = await asWeb(manager, `/objects?userId=${admin.user.id}`);

        expect(response.status).toBe(200);
        expect(ids(response.body)).toEqual(expect.arrayContaining([assignedObject.id, foreignObject.id]));
    });

    it('ограничивает request-mode назначенными объектами и игнорирует spoofed userId', async () => {
        const response = await asWeb(manager, `/objects?scope=requests&userId=${admin.user.id}`);

        expect(response.status).toBe(200);
        expect(ids(response.body)).toContain(assignedObject.id);
        expect(ids(response.body)).not.toContain(foreignObject.id);
    });

    it('возвращает пустой request-mode Менеджеру без назначений', async () => {
        const response = await asWeb(emptyManager, '/objects?scope=requests');

        expect(response.status).toBe(200);
        expect(response.body).toEqual([]);
    });

    it('не отдаёт Customer/Contractor полный directory, но self-mode строит по actor.userId', async () => {
        const [customerFull, contractorFull, customerScoped, contractorScoped] = await Promise.all([
            asWeb(customer, `/objects?userId=${admin.user.id}`),
            asWeb(contractor, '/objects'),
            asWeb(customer, `/objects?scope=requests&userId=${admin.user.id}`),
            asWeb(contractor, `/objects?scope=requests&userId=${manager.user.id}`),
        ]);

        expect(customerFull.status).toBe(403);
        expect(contractorFull.status).toBe(403);
        expect(customerScoped.status).toBe(200);
        expect(ids(customerScoped.body)).toContain(assignedObject.id);
        expect(ids(customerScoped.body)).not.toContain(foreignObject.id);
        expect(contractorScoped.status).toBe(200);
        expect(ids(contractorScoped.body)).toContain(foreignObject.id);
        expect(ids(contractorScoped.body)).not.toContain(assignedObject.id);
    });

    it('отдаёт Администратору все объекты в обоих режимах', async () => {
        const [directory, requestScope] = await Promise.all([
            asWeb(admin, '/objects'),
            asWeb(admin, '/objects?scope=requests'),
        ]);

        for (const response of [directory, requestScope]) {
            expect(response.status).toBe(200);
            expect(ids(response.body)).toEqual(expect.arrayContaining([assignedObject.id, foreignObject.id]));
        }
    });

    it('сохраняет legacy tgUserId lookup для bot actor', async () => {
        const response = await request(app)
            .get(`/objects?tgUserId=${legacyTgUser.id}`)
            .set('master-api-key', masterKey);

        expect(response.status).toBe(200);
        expect(ids(response.body)).toContain(assignedObject.id);
        expect(ids(response.body)).not.toContain(foreignObject.id);
    });

    it('разрешает Менеджеру create, update, read и delete объекта', async () => {
        const { legal, unit } = await ensureBaseRefs();
        const created = await request(app)
            .post('/objects')
            .set('Authorization', manager.authHeader)
            .send({
                name: `Manager CRUD ${suffix}`,
                unitId: unit.id,
                legalEntityId: legal.id,
                city: 'Москва',
                budgetPlan: 700,
            });

        expect(created.status).toBe(200);
        const objectId = created.body.id as string;
        const updated = await request(app)
            .patch(`/objects/${objectId}`)
            .set('Authorization', manager.authHeader)
            .send({ name: `Manager CRUD updated ${suffix}`, budgetPlan: 900 });
        const read = await request(app).get(`/objects/${objectId}`).set('Authorization', manager.authHeader);
        const deleted = await request(app).delete(`/objects/${objectId}`).set('Authorization', manager.authHeader);

        expect(updated.status).toBe(200);
        expect(read.status).toBe(200);
        expect(read.body).toMatchObject({ id: objectId, name: `Manager CRUD updated ${suffix}`, budgetPlan: 900 });
        expect(deleted.status).toBe(200);
        expect(await ObjectDir.findByPk(objectId)).toBeNull();
    });

    it('требует actor authentication для объекта', async () => {
        const response = await request(app).get('/objects');

        expect(response.status).toBe(401);
    });
});
