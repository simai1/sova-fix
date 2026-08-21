import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

vi.mock('../../src/services/email.service', () => ({ default: vi.fn() }));

import app from '../../src/app';
import Contractor from '../../src/models/contractor';
import ObjectDir from '../../src/models/object';
import RepairRequest from '../../src/models/repairRequest';
import { createAdminAuth, TestAdminAuth } from '../helpers/auth-helper';
import { createRequest, ensureBaseRefs } from '../helpers/lk-helper';

/**
 * Прод-инцидент: в contractors нашлась живая строка без userId и tgUserId
 * (04c6ee14-0b58-4d17-9c8e-0cb67d89e22e). getContractorNameOrThrow бросал на ней
 * голый Error прямо в map по заявкам, и одна такая строка роняла в 500
 * весь GET /requests и весь GET /contractors.
 */
describe('Осиротевшая запись Contractor не роняет выборки', () => {
    const suffix = `${process.pid}-${Date.now()}`;
    const login = `orphan-contractor-admin-${suffix}@test.local`;
    let admin: TestAdminAuth;
    let orphan: Contractor;
    let object: ObjectDir;
    let requestWithOrphan: RepairRequest;

    beforeAll(async () => {
        admin = await createAdminAuth(login);
        const { legal, unit } = await ensureBaseRefs();
        object = await ObjectDir.create({
            name: `Orphan contractor object ${suffix}`,
            unitId: unit.id,
            legalEntityId: legal.id,
            city: 'Москва',
            number: 0,
        } as ObjectDir);
        orphan = await Contractor.create({});
        requestWithOrphan = await createRequest({ objectId: object.id, contractorId: orphan.id } as never);
    });

    afterAll(async () => {
        await RepairRequest.destroy({ where: { id: requestWithOrphan.id }, force: true });
        await Contractor.destroy({ where: { id: orphan.id }, force: true });
        await ObjectDir.destroy({ where: { id: object.id }, force: true });
    });

    it('GET /requests отдаёт заявку с contractor: null', async () => {
        const response = await request(app).get('/requests').set('Authorization', admin.authHeader);

        expect(response.status).toBe(200);
        const row = response.body.data.find((r: { id: string }) => r.id === requestWithOrphan.id);
        expect(row).toBeDefined();
        expect(row.contractor).toBeNull();
    });

    it('GET /contractors не отдаёт осиротевшую запись', async () => {
        const response = await request(app).get('/contractors').set('Authorization', admin.authHeader);

        expect(response.status).toBe(200);
        expect(response.body.map((c: { id: string }) => c.id)).not.toContain(orphan.id);
    });
});
