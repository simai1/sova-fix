import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import RepairRequest from '../../src/models/repairRequest';
import Contractor from '../../src/models/contractor';
import Urgency from '../../src/models/urgency';
import Status from '../../src/models/status';
import { createUserAuth, ensureBaseRefs, createContractorFor, cleanupByLogin, TestAuth } from '../helpers/lk-helper';
import roles from '../../src/config/roles';

// Сортировка проверяет два разных пути:
//  - sort=urgency раскрывается в ORDER BY "Urgency"."number" через include-relation
//    (UUID-сортировка по urgencyId бессмысленна для пользователя);
//  - sort=status сортирует по самому RepairRequest.status (SMALLINT 1..5 из
//    config/statuses.ts) — это канонический источник, statusId-UUID на большинстве
//    заявок остаётся null (см. correctness-audit B1, design-doc §B.2).
describe('LK list — сортировка по urgency.number / status.number', () => {
    const meLogin = 'lk-sort-me@t.local';
    let me: TestAuth;
    let myContractor: Contractor;

    let urgencyLow: Urgency;
    let urgencyHigh: Urgency;
    let statusNew: Status;
    let statusDone: Status;

    let reqLowNew: RepairRequest;
    let reqHighDone: RepairRequest;

    beforeAll(async () => {
        const refs = await ensureBaseRefs();
        await cleanupByLogin(meLogin);

        me = await createUserAuth(meLogin, roles.CONTRACTOR, 'Sort Me');
        myContractor = await createContractorFor(me.user, 'SortContr');

        // Используем существующие или создаём пары Urgency/Status с
        // различающимися number (beforeCreate-хук назначает следующий номер).
        urgencyLow = await Urgency.create({ name: 'LK Sort Urg Low', color: '#fff', number: 0 } as any);
        urgencyHigh = await Urgency.create({ name: 'LK Sort Urg High', color: '#fff', number: 0 } as any);

        statusNew = await Status.create({ name: 'LK Sort St New', color: '#fff', number: 0 } as any);
        statusDone = await Status.create({ name: 'LK Sort St Done', color: '#fff', number: 0 } as any);

        // Заявка А: низкая urgency.number, RepairRequest.status = NEW_REQUEST (1).
        // statusId оставляем для совместимости с другими местами кода, но
        // ключевое для sort=status — собственный SMALLINT-поле.
        reqLowNew = await RepairRequest.create({
            unitId: refs.unit.id,
            legalEntityId: refs.legal.id,
            urgency: urgencyLow.name,
            urgencyId: urgencyLow.id,
            statusId: statusNew.id,
            status: 1,
            builder: 'Укажите подрядчика',
            daysAtWork: 0,
            number: 0,
            contractorId: myContractor.id,
        } as any);
        // Заявка B: высокая urgency.number, RepairRequest.status = DONE (3).
        reqHighDone = await RepairRequest.create({
            unitId: refs.unit.id,
            legalEntityId: refs.legal.id,
            urgency: urgencyHigh.name,
            urgencyId: urgencyHigh.id,
            statusId: statusDone.id,
            status: 3,
            builder: 'Укажите подрядчика',
            daysAtWork: 0,
            number: 0,
            contractorId: myContractor.id,
        } as any);
    });

    afterAll(async () => {
        await RepairRequest.destroy({ where: { id: [reqLowNew.id, reqHighDone.id] }, force: true });
        await Contractor.destroy({ where: { id: myContractor.id }, force: true });
        await Urgency.destroy({ where: { id: [urgencyLow.id, urgencyHigh.id] }, force: true });
        await Status.destroy({ where: { id: [statusNew.id, statusDone.id] }, force: true });
        await cleanupByLogin(meLogin);
    });

    // Нам нужно проверить, что сортировка по relation.number действительно
    // работает: позиция reqLowNew относительно reqHighDone должна совпадать
    // с порядком numbers в Urgency / Status.
    const indexOf = (items: any[], id: string): number => items.findIndex(r => r.id === id);

    it('sort=urgency&order=desc → заявка с большим Urgency.number раньше', async () => {
        const res = await request(app)
            .get('/lk/requests?role=contractor&sort=urgency&order=desc&limit=100')
            .set('Authorization', me.authHeader)
            .set('Cookie', me.cookie);
        expect(res.status).toBe(200);
        const iLow = indexOf(res.body.items, reqLowNew.id);
        const iHigh = indexOf(res.body.items, reqHighDone.id);
        expect(iLow).toBeGreaterThanOrEqual(0);
        expect(iHigh).toBeGreaterThanOrEqual(0);
        // urgencyHigh.number > urgencyLow.number → high идёт раньше при DESC.
        expect(iHigh).toBeLessThan(iLow);
    });

    it('sort=urgency&order=asc → заявка с меньшим Urgency.number раньше', async () => {
        const res = await request(app)
            .get('/lk/requests?role=contractor&sort=urgency&order=asc&limit=100')
            .set('Authorization', me.authHeader)
            .set('Cookie', me.cookie);
        expect(res.status).toBe(200);
        const iLow = indexOf(res.body.items, reqLowNew.id);
        const iHigh = indexOf(res.body.items, reqHighDone.id);
        expect(iLow).toBeLessThan(iHigh);
    });

    it('sort=status&order=asc → меньший Status.number раньше', async () => {
        const res = await request(app)
            .get('/lk/requests?role=contractor&sort=status&order=asc&limit=100')
            .set('Authorization', me.authHeader)
            .set('Cookie', me.cookie);
        expect(res.status).toBe(200);
        const iNew = indexOf(res.body.items, reqLowNew.id);
        const iDone = indexOf(res.body.items, reqHighDone.id);
        expect(iNew).toBeLessThan(iDone);
    });

    it('sort=status&order=desc → больший Status.number раньше', async () => {
        const res = await request(app)
            .get('/lk/requests?role=contractor&sort=status&order=desc&limit=100')
            .set('Authorization', me.authHeader)
            .set('Cookie', me.cookie);
        expect(res.status).toBe(200);
        const iNew = indexOf(res.body.items, reqLowNew.id);
        const iDone = indexOf(res.body.items, reqHighDone.id);
        expect(iDone).toBeLessThan(iNew);
    });

    it('sort=date (алиас createdAt) принимается без ошибки', async () => {
        const res = await request(app)
            .get('/lk/requests?role=contractor&sort=date&order=desc&limit=100')
            .set('Authorization', me.authHeader)
            .set('Cookie', me.cookie);
        expect(res.status).toBe(200);
    });
});
