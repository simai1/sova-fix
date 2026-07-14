import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

vi.mock('../../src/services/email.service', () => ({ default: vi.fn() }));
vi.mock('../../src/utils/migrationUtils', () => ({
    migrateManagerIds: vi.fn().mockResolvedValue(undefined),
    validateManagerIds: vi.fn().mockResolvedValue(undefined),
}));

import app from '../../src/app';
import roles from '../../src/config/roles';
import Contractor from '../../src/models/contractor';
import RepairRequest from '../../src/models/repairRequest';
import { migrateManagerIds, validateManagerIds } from '../../src/utils/migrationUtils';
import { createAdminAuth, createManagerAuth, TestAdminAuth } from '../helpers/auth-helper';
import { cleanupByLogin, createContractorFor, createRequest, createUserAuth, TestAuth } from '../helpers/lk-helper';

describe('legacy /requests actor auth', () => {
    const suffix = `${process.pid}-${Date.now()}`;
    const masterKey = `requests-master-${suffix}`;
    const previousMasterKey = process.env.MASTER_API_KEY;
    const logins = {
        admin: `requests-auth-admin-${suffix}@test.local`,
        manager: `requests-auth-manager-${suffix}@test.local`,
        customer: `requests-auth-customer-${suffix}@test.local`,
        contractor: `requests-auth-contractor-${suffix}@test.local`,
    };
    let admin: TestAdminAuth;
    let manager: TestAdminAuth;
    let customer: TestAuth;
    let contractor: TestAuth;
    let contractorModel: Contractor;
    let objectlessRequest: RepairRequest;

    beforeAll(async () => {
        process.env.MASTER_API_KEY = masterKey;
        admin = await createAdminAuth(logins.admin);
        manager = await createManagerAuth(logins.manager);
        customer = await createUserAuth(logins.customer, roles.CUSTOMER);
        contractor = await createUserAuth(logins.contractor, roles.CONTRACTOR);
        contractorModel = await createContractorFor(contractor.user);
        objectlessRequest = await createRequest({ objectId: null } as any);
    });

    afterAll(async () => {
        await RepairRequest.destroy({ where: { id: objectlessRequest.id }, force: true });
        for (const login of Object.values(logins)) await cleanupByLogin(login);
        if (previousMasterKey === undefined) delete process.env.MASTER_API_KEY;
        else process.env.MASTER_API_KEY = previousMasterKey;
    });

    it('не принимает anonymous и принимает Bearer без refresh cookie', async () => {
        expect((await request(app).get('/requests')).status).toBe(401);
        expect((await request(app).get('/requests').set('Authorization', admin.authHeader)).status).toBe(200);
    });

    it('сохраняет доступ Telegram-бота через master key', async () => {
        const response = await request(app).get('/requests').set('master-api-key', masterKey);

        expect(response.status).toBe(200);
    });

    it('bot назначает исполнителя objectless legacy заявке без UUID ошибки', async () => {
        const response = await request(app).patch('/requests/set/contractor').set('master-api-key', masterKey).send({
            requestId: objectlessRequest.id,
            contractorId: contractorModel.id,
        });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ status: 'OK' });
        await objectlessRequest.reload();
        expect(objectlessRequest.contractorId).toBe(contractorModel.id);
    });

    it('запрещает Customer и Contractor legacy API', async () => {
        const responses = await Promise.all([
            request(app).get('/requests').set('Authorization', customer.authHeader),
            request(app).get('/requests').set('Authorization', contractor.authHeader),
        ]);

        expect(responses.map(response => response.status)).toEqual([403, 403]);
    });

    it('разрешает миграции только web Admin', async () => {
        const cases = [
            { path: '/requests/validate/manager-ids', handler: vi.mocked(validateManagerIds) },
            { path: '/requests/migrate/manager-ids', handler: vi.mocked(migrateManagerIds) },
        ];

        for (const testCase of cases) {
            testCase.handler.mockClear();
            const [managerResponse, botResponse] = await Promise.all([
                request(app).post(testCase.path).set('Authorization', manager.authHeader),
                request(app).post(testCase.path).set('master-api-key', masterKey),
            ]);

            expect(managerResponse.status, testCase.path).toBe(403);
            expect(botResponse.status, testCase.path).toBe(403);
            expect(testCase.handler, testCase.path).not.toHaveBeenCalled();

            const adminResponse = await request(app).post(testCase.path).set('Authorization', admin.authHeader);

            expect(adminResponse.status, testCase.path).toBe(200);
            expect(testCase.handler, testCase.path).toHaveBeenCalledOnce();
        }
    });
});
