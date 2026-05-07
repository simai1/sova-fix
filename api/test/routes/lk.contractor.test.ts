import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import RepairRequest from '../../src/models/repairRequest';
import Contractor from '../../src/models/contractor';
import {
    createUserAuth,
    ensureBaseRefs,
    createObjectFor,
    createContractorFor,
    createRequest,
    cleanupByLogin,
    TestAuth,
} from '../helpers/lk-helper';
import roles from '../../src/config/roles';
import statuses from '../../src/config/statuses';

describe('LK Contractor flow', () => {
    const meLogin = 'lk-contr@t.local';
    const otherLogin = 'lk-other-contr@t.local';
    let me: TestAuth;
    let other: TestAuth;
    let myContractor: Contractor;
    let otherContractor: Contractor;
    let myRequest: RepairRequest;
    let otherRequest: RepairRequest;
    let byObjectRequest: RepairRequest;

    beforeAll(async () => {
        await ensureBaseRefs();
        await cleanupByLogin(meLogin);
        await cleanupByLogin(otherLogin);

        me = await createUserAuth(meLogin, roles.CONTRACTOR, 'Me Contr');
        other = await createUserAuth(otherLogin, roles.CONTRACTOR, 'Other Contr');

        myContractor = await createContractorFor(me.user, 'MyContr');
        otherContractor = await createContractorFor(other.user, 'OtherContr');

        const obj = await createObjectFor(me.user, 'LKContrObj');

        myRequest = await createRequest({ contractorId: myContractor.id });
        otherRequest = await createRequest({ contractorId: otherContractor.id });
        byObjectRequest = await createRequest({ objectId: obj.id });
    });

    afterAll(async () => {
        await RepairRequest.destroy({
            where: { id: [myRequest.id, otherRequest.id, byObjectRequest.id] },
            force: true,
        });
        await Contractor.destroy({ where: { id: [myContractor.id, otherContractor.id] }, force: true });
        await cleanupByLogin(meLogin);
        await cleanupByLogin(otherLogin);
    });

    it('GET /lk/me возвращает userId, contractor.id и objectIds', async () => {
        const res = await request(app).get('/lk/me').set('Authorization', me.authHeader).set('Cookie', me.cookie);
        expect(res.status).toBe(200);
        expect(res.body.user.id).toBe(me.user.id);
        expect(res.body.contractor.id).toBe(myContractor.id);
        expect(Array.isArray(res.body.objectIds)).toBe(true);
        expect(res.body.objectIds.length).toBeGreaterThan(0);
    });

    it('GET /lk/requests?role=contractor показывает только мои + по объектам', async () => {
        const res = await request(app)
            .get('/lk/requests?role=contractor&limit=100')
            .set('Authorization', me.authHeader)
            .set('Cookie', me.cookie);
        expect(res.status).toBe(200);
        const ids = res.body.items.map((r: any) => r.id);
        expect(ids).toContain(myRequest.id);
        expect(ids).toContain(byObjectRequest.id);
        expect(ids).not.toContain(otherRequest.id);
    });

    it('GET /lk/requests/:id чужая → 403', async () => {
        const res = await request(app)
            .get(`/lk/requests/${otherRequest.id}`)
            .set('Authorization', me.authHeader)
            .set('Cookie', me.cookie);
        expect(res.status).toBe(403);
        expect(res.body.message).toMatch(/нет доступа/i);
    });

    it('PATCH status DONE без checkPhoto → 400 на русском', async () => {
        await myRequest.update({ checkPhoto: null, status: statuses.AT_WORK });
        const res = await request(app)
            .patch(`/lk/requests/${myRequest.id}/status`)
            .set('Authorization', me.authHeader)
            .set('Cookie', me.cookie)
            .send({ statusNumber: statuses.DONE });
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/фото-подтверждения/i);
    });

    it('PATCH status DONE с checkPhoto → 200, статус 3', async () => {
        await myRequest.update({ checkPhoto: 'fake.jpg', status: statuses.AT_WORK });
        const res = await request(app)
            .patch(`/lk/requests/${myRequest.id}/status`)
            .set('Authorization', me.authHeader)
            .set('Cookie', me.cookie)
            .send({ statusNumber: statuses.DONE });
        expect(res.status).toBe(200);
        expect(res.body.status).toBe(statuses.DONE);
        const fresh = await RepairRequest.findByPk(myRequest.id);
        expect(fresh?.status).toBe(statuses.DONE);
        expect(fresh?.completeDate).toBeTruthy();
    });

    it('PATCH status чужой заявки → 403', async () => {
        const res = await request(app)
            .patch(`/lk/requests/${otherRequest.id}/status`)
            .set('Authorization', me.authHeader)
            .set('Cookie', me.cookie)
            .send({ statusNumber: statuses.AT_WORK });
        expect(res.status).toBe(403);
    });
});
