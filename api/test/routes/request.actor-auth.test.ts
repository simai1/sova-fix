import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

vi.mock('../../src/services/email.service', () => ({ default: vi.fn() }));

import app from '../../src/app';
import roles from '../../src/config/roles';
import { createAdminAuth, createManagerAuth, TestAdminAuth } from '../helpers/auth-helper';
import { cleanupByLogin, createUserAuth, TestAuth } from '../helpers/lk-helper';

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

    beforeAll(async () => {
        process.env.MASTER_API_KEY = masterKey;
        admin = await createAdminAuth(logins.admin);
        manager = await createManagerAuth(logins.manager);
        customer = await createUserAuth(logins.customer, roles.CUSTOMER);
        contractor = await createUserAuth(logins.contractor, roles.CONTRACTOR);
    });

    afterAll(async () => {
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

    it('запрещает Customer и Contractor legacy API', async () => {
        const responses = await Promise.all([
            request(app).get('/requests').set('Authorization', customer.authHeader),
            request(app).get('/requests').set('Authorization', contractor.authHeader),
        ]);

        expect(responses.map(response => response.status)).toEqual([403, 403]);
    });

    it('разрешает миграции только web Admin', async () => {
        const [managerResponse, botResponse] = await Promise.all([
            request(app).post('/requests/validate/manager-ids').set('Authorization', manager.authHeader),
            request(app).post('/requests/validate/manager-ids').set('master-api-key', masterKey),
        ]);

        expect(managerResponse.status).toBe(403);
        expect(botResponse.status).toBe(403);
    });
});
