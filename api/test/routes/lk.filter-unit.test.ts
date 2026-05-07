import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import RepairRequest from '../../src/models/repairRequest';
import Contractor from '../../src/models/contractor';
import ObjectDir from '../../src/models/object';
import Unit from '../../src/models/unit';
import LegalEntity from '../../src/models/legalEntity';
import UserObject from '../../src/models/userObject';
import { createUserAuth, ensureBaseRefs, createContractorFor, cleanupByLogin, TestAuth } from '../helpers/lk-helper';
import roles from '../../src/config/roles';

describe('LK list — фильтр по unitId', () => {
    const meLogin = 'lk-flt-me@t.local';
    let me: TestAuth;
    let myContractor: Contractor;
    let unitA: Unit;
    let unitB: Unit;
    let objectA: ObjectDir;
    let objectB: ObjectDir;
    let reqA: RepairRequest;
    let reqB: RepairRequest;

    beforeAll(async () => {
        const refs = await ensureBaseRefs();
        await cleanupByLogin(meLogin);

        me = await createUserAuth(meLogin, roles.CONTRACTOR, 'Filter Me');
        myContractor = await createContractorFor(me.user, 'FltContr');

        // Два отдельных Unit, чтобы тест мог различать заявки по unitId.
        unitA = await Unit.create({ name: 'LK Filter Unit A', count: 0, number: 0 } as any);
        unitB = await Unit.create({ name: 'LK Filter Unit B', count: 0, number: 0 } as any);

        objectA = await ObjectDir.create({
            name: `LK Filter Obj A ${me.user.id.slice(0, 6)}`,
            unitId: unitA.id,
            legalEntityId: refs.legal.id,
            city: 'Москва',
            number: 0,
        } as any);
        objectB = await ObjectDir.create({
            name: `LK Filter Obj B ${me.user.id.slice(0, 6)}`,
            unitId: unitB.id,
            legalEntityId: refs.legal.id,
            city: 'Москва',
            number: 0,
        } as any);
        // Привязываем оба объекта к юзеру — чтобы он видел заявки на обоих.
        await UserObject.create({ userId: me.user.id, objectId: objectA.id });
        await UserObject.create({ userId: me.user.id, objectId: objectB.id });

        reqA = await RepairRequest.create({
            unitId: unitA.id,
            legalEntityId: refs.legal.id,
            objectId: objectA.id,
            urgency: refs.urgency.name,
            urgencyId: refs.urgency.id,
            status: 1,
            builder: 'Укажите подрядчика',
            daysAtWork: 0,
            number: 0,
            contractorId: myContractor.id,
        } as any);
        reqB = await RepairRequest.create({
            unitId: unitB.id,
            legalEntityId: refs.legal.id,
            objectId: objectB.id,
            urgency: refs.urgency.name,
            urgencyId: refs.urgency.id,
            status: 1,
            builder: 'Укажите подрядчика',
            daysAtWork: 0,
            number: 0,
            contractorId: myContractor.id,
        } as any);
    });

    afterAll(async () => {
        await RepairRequest.destroy({ where: { id: [reqA.id, reqB.id] }, force: true });
        await UserObject.destroy({ where: { userId: me.user.id }, force: true });
        await ObjectDir.destroy({ where: { id: [objectA.id, objectB.id] }, force: true });
        await Unit.destroy({ where: { id: [unitA.id, unitB.id] }, force: true });
        await Contractor.destroy({ where: { id: myContractor.id }, force: true });
        await cleanupByLogin(meLogin);
    });

    it('?unitId=A возвращает только заявки в Unit A', async () => {
        const res = await request(app)
            .get(`/lk/requests?role=contractor&unitId=${unitA.id}&limit=100`)
            .set('Authorization', me.authHeader)
            .set('Cookie', me.cookie);
        expect(res.status).toBe(200);
        const ids = res.body.items.map((r: any) => r.id);
        expect(ids).toContain(reqA.id);
        expect(ids).not.toContain(reqB.id);
    });

    it('?unitId=B возвращает только заявки в Unit B', async () => {
        const res = await request(app)
            .get(`/lk/requests?role=contractor&unitId=${unitB.id}&limit=100`)
            .set('Authorization', me.authHeader)
            .set('Cookie', me.cookie);
        expect(res.status).toBe(200);
        const ids = res.body.items.map((r: any) => r.id);
        expect(ids).toContain(reqB.id);
        expect(ids).not.toContain(reqA.id);
    });

    it('?unitId=несуществующий-uuid → пустой список', async () => {
        const fakeUnitId = '00000000-0000-4000-8000-000000000099';
        const res = await request(app)
            .get(`/lk/requests?role=contractor&unitId=${fakeUnitId}&limit=100`)
            .set('Authorization', me.authHeader)
            .set('Cookie', me.cookie);
        expect(res.status).toBe(200);
        const ids = res.body.items.map((r: any) => r.id);
        expect(ids).not.toContain(reqA.id);
        expect(ids).not.toContain(reqB.id);
    });

    it('?unitId=invalid (не uuid) → 400 валидации', async () => {
        const res = await request(app)
            .get(`/lk/requests?role=contractor&unitId=not-a-uuid&limit=100`)
            .set('Authorization', me.authHeader)
            .set('Cookie', me.cookie);
        expect(res.status).toBe(400);
    });

    it('legalEntityId фильтр работает аналогично', async () => {
        const refs = await ensureBaseRefs();
        // Создаём вторую LegalEntity и заявку в ней.
        const legal2 = await LegalEntity.create({
            name: 'LK Filter LE 2',
            legalForm: 'ООО',
            startCoop: new Date(),
            count: 0,
            number: 0,
        } as any);
        const obj2 = await ObjectDir.create({
            name: `LK Filter Obj LE2 ${me.user.id.slice(0, 6)}`,
            unitId: unitA.id,
            legalEntityId: legal2.id,
            city: 'Москва',
            number: 0,
        } as any);
        await UserObject.create({ userId: me.user.id, objectId: obj2.id });
        const req2 = await RepairRequest.create({
            unitId: unitA.id,
            legalEntityId: legal2.id,
            objectId: obj2.id,
            urgency: refs.urgency.name,
            urgencyId: refs.urgency.id,
            status: 1,
            builder: 'Укажите подрядчика',
            daysAtWork: 0,
            number: 0,
            contractorId: myContractor.id,
        } as any);

        try {
            const res = await request(app)
                .get(`/lk/requests?role=contractor&legalEntityId=${legal2.id}&limit=100`)
                .set('Authorization', me.authHeader)
                .set('Cookie', me.cookie);
            expect(res.status).toBe(200);
            const ids = res.body.items.map((r: any) => r.id);
            expect(ids).toContain(req2.id);
            expect(ids).not.toContain(reqA.id);
            expect(ids).not.toContain(reqB.id);
        } finally {
            await RepairRequest.destroy({ where: { id: req2.id }, force: true });
            await UserObject.destroy({ where: { userId: me.user.id, objectId: obj2.id }, force: true });
            await ObjectDir.destroy({ where: { id: obj2.id }, force: true });
            await LegalEntity.destroy({ where: { id: legal2.id }, force: true });
        }
    });
});
