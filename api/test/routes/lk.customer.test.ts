import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import RepairRequest from '../../src/models/repairRequest';
import ObjectDir from '../../src/models/object';
import {
    createUserAuth,
    ensureBaseRefs,
    createObjectFor,
    createRequest,
    cleanupByLogin,
    TestAuth,
} from '../helpers/lk-helper';
import roles from '../../src/config/roles';

describe('LK Customer flow', () => {
    const meLogin = 'lk-cust@t.local';
    const otherLogin = 'lk-other-cust@t.local';
    let me: TestAuth;
    let other: TestAuth;
    let myObj: ObjectDir;
    let foreignObj: ObjectDir;
    let myRequest: RepairRequest;
    let otherRequest: RepairRequest;
    let urgencyId: string;

    beforeAll(async () => {
        const refs = await ensureBaseRefs();
        urgencyId = refs.urgency.id;
        await cleanupByLogin(meLogin);
        await cleanupByLogin(otherLogin);

        me = await createUserAuth(meLogin, roles.CUSTOMER, 'Me Cust');
        other = await createUserAuth(otherLogin, roles.CUSTOMER, 'Other Cust');

        myObj = await createObjectFor(me.user, 'CustObj');
        foreignObj = await createObjectFor(other.user, 'ForeignObj');

        myRequest = await createRequest({ objectId: myObj.id, createdByUserId: me.user.id });
        otherRequest = await createRequest({ objectId: foreignObj.id, createdByUserId: other.user.id });
    });

    afterAll(async () => {
        await RepairRequest.destroy({
            where: { id: [myRequest.id, otherRequest.id] },
            force: true,
            individualHooks: false,
        });
        await ObjectDir.destroy({ where: { id: [myObj.id, foreignObj.id] }, force: true });
        await cleanupByLogin(meLogin);
        await cleanupByLogin(otherLogin);
    });

    it('GET /lk/requests?role=customer показывает только свои/по своим объектам', async () => {
        const res = await request(app)
            .get('/lk/requests?role=customer&limit=100')
            .set('Authorization', me.authHeader)
            .set('Cookie', me.cookie);
        expect(res.status).toBe(200);
        const ids = res.body.items.map((r: any) => r.id);
        expect(ids).toContain(myRequest.id);
        expect(ids).not.toContain(otherRequest.id);
    });

    it('GET чужой заявки → 403', async () => {
        const res = await request(app)
            .get(`/lk/requests/${otherRequest.id}`)
            .set('Authorization', me.authHeader)
            .set('Cookie', me.cookie);
        expect(res.status).toBe(403);
        expect(res.body.message).toMatch(/нет доступа/i);
    });

    it('POST /lk/requests на не свой объект → 400', async () => {
        const res = await request(app)
            .post('/lk/requests')
            .set('Authorization', me.authHeader)
            .set('Cookie', me.cookie)
            .send({
                objectId: foreignObj.id,
                problemDescription: 'Description',
                urgencyId,
            });
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/не входит в список ваших доступных/i);
    });

    it('POST /lk/requests на свой объект → 201, createdByUserId=me', async () => {
        const res = await request(app)
            .post('/lk/requests')
            .set('Authorization', me.authHeader)
            .set('Cookie', me.cookie)
            .send({
                objectId: myObj.id,
                problemDescription: 'Сломалась дверь',
                urgencyId,
            });
        expect(res.status).toBe(201);
        expect(res.body.id).toBeDefined();
        expect(res.body.createdByUserId).toBe(me.user.id);
        expect(res.body.objectId).toBe(myObj.id);
        // Cleanup the just-created request
        await RepairRequest.destroy({ where: { id: res.body.id }, force: true });
    });

    it('Customer не имеет доступа к /lk/requests/:id/status (контрактор-only)', async () => {
        const res = await request(app)
            .patch(`/lk/requests/${myRequest.id}/status`)
            .set('Authorization', me.authHeader)
            .set('Cookie', me.cookie)
            .send({ statusNumber: 2 });
        expect(res.status).toBe(403);
    });
});
