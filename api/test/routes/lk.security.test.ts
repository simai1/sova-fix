import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import * as fs from 'fs';
import * as path from 'path';
import app from '../../src/app';
import RepairRequest from '../../src/models/repairRequest';
import Contractor from '../../src/models/contractor';
import ObjectDir from '../../src/models/object';
import UserObject from '../../src/models/userObject';
import {
    createUserAuth,
    ensureBaseRefs,
    createObjectFor,
    createContractorFor,
    createRequest,
    cleanupByLogin,
    TestAuth,
} from '../helpers/lk-helper';
import { createAdminAuth, TestAdminAuth } from '../helpers/auth-helper';
import roles from '../../src/config/roles';
import statuses from '../../src/config/statuses';

const UPLOADS_DIR = path.resolve('./uploads');

const countUploads = (): number => {
    if (!fs.existsSync(UPLOADS_DIR)) return 0;
    return fs.readdirSync(UPLOADS_DIR).filter(name => !name.startsWith('.')).length;
};

describe('LK security: write-access, state-machine, UUID-валидация', () => {
    const meLogin = 'lk-sec-me@t.local';
    const assigneeLogin = 'lk-sec-assignee@t.local';
    const adminLogin = 'lk-sec-admin@t.local';
    let me: TestAuth;
    let assignee: TestAuth;
    let admin: TestAdminAuth;
    let myContractor: Contractor;
    let assigneeContractor: Contractor;
    let sharedObject: ObjectDir;
    // Заявка назначена на assigneeContractor, но привязана к sharedObject —
    // у `me` есть read-доступ через объект, но НЕ должен быть write-доступ.
    let foreignAssignedRequest: RepairRequest;
    let myAssignedRequest: RepairRequest;

    beforeAll(async () => {
        await ensureBaseRefs();
        await cleanupByLogin(meLogin);
        await cleanupByLogin(assigneeLogin);
        await cleanupByLogin(adminLogin);

        me = await createUserAuth(meLogin, roles.CONTRACTOR, 'Sec Me');
        assignee = await createUserAuth(assigneeLogin, roles.CONTRACTOR, 'Sec Assignee');
        admin = await createAdminAuth(adminLogin);

        myContractor = await createContractorFor(me.user, 'SecMyContr');
        assigneeContractor = await createContractorFor(assignee.user, 'SecAssigneeContr');

        // Общий объект, к которому привязаны оба подрядчика — даёт read-доступ
        // через UserObject обоим, но write остаётся только у назначенного.
        sharedObject = await createObjectFor(me.user, 'SecSharedObj');
        await UserObject.create({ userId: assignee.user.id, objectId: sharedObject.id });

        foreignAssignedRequest = await createRequest({
            objectId: sharedObject.id,
            contractorId: assigneeContractor.id,
            status: statuses.NEW_REQUEST,
        });
        myAssignedRequest = await createRequest({
            objectId: sharedObject.id,
            contractorId: myContractor.id,
            status: statuses.NEW_REQUEST,
        });
    });

    afterAll(async () => {
        await RepairRequest.destroy({
            where: { id: [foreignAssignedRequest.id, myAssignedRequest.id] },
            force: true,
        });
        await Contractor.destroy({
            where: { id: [myContractor.id, assigneeContractor.id] },
            force: true,
        });
        await ObjectDir.destroy({ where: { id: sharedObject.id }, force: true });
        await cleanupByLogin(meLogin);
        await cleanupByLogin(assigneeLogin);
        await cleanupByLogin(adminLogin);
    });

    describe('LK-C2: write-access строже read-access', () => {
        it('GET чужой заявки через объект → 200 (read разрешён)', async () => {
            const res = await request(app)
                .get(`/lk/requests/${foreignAssignedRequest.id}`)
                .set('Authorization', me.authHeader)
                .set('Cookie', me.cookie);
            expect(res.status).toBe(200);
            expect(res.body.id).toBe(foreignAssignedRequest.id);
        });

        it('POST /comments на чужую заявку (read через объект) → 403', async () => {
            const res = await request(app)
                .post(`/lk/requests/${foreignAssignedRequest.id}/comments`)
                .set('Authorization', me.authHeader)
                .set('Cookie', me.cookie)
                .field('text', 'Несанкционированный комментарий');
            expect(res.status).toBe(403);
            expect(res.body.message).toMatch(/назначенный исполнитель/i);
        });

        it('POST /photos на чужую заявку (read через объект) → 403', async () => {
            const res = await request(app)
                .post(`/lk/requests/${foreignAssignedRequest.id}/photos`)
                .set('Authorization', me.authHeader)
                .set('Cookie', me.cookie);
            expect(res.status).toBe(403);
            expect(res.body.message).toMatch(/назначенный исполнитель/i);
        });
    });

    describe('LK-C3: state-machine для setStatus', () => {
        it('NEW_REQUEST(1) → DONE(3) запрещён, 400', async () => {
            await myAssignedRequest.update({ status: statuses.NEW_REQUEST, checkPhoto: 'fake.jpg' });
            const res = await request(app)
                .patch(`/lk/requests/${myAssignedRequest.id}/status`)
                .set('Authorization', me.authHeader)
                .set('Cookie', me.cookie)
                .send({ statusNumber: statuses.DONE });
            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/Недопустимый переход/i);
        });

        it('NEW_REQUEST(1) → IRRELEVANT(4) запрещён, 400', async () => {
            await myAssignedRequest.update({ status: statuses.NEW_REQUEST });
            const res = await request(app)
                .patch(`/lk/requests/${myAssignedRequest.id}/status`)
                .set('Authorization', me.authHeader)
                .set('Cookie', me.cookie)
                .send({ statusNumber: statuses.IRRELEVANT });
            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/Недопустимый переход/i);
        });

        it('AT_WORK(2) → FALSE(5) запрещён, 400', async () => {
            await myAssignedRequest.update({ status: statuses.AT_WORK });
            const res = await request(app)
                .patch(`/lk/requests/${myAssignedRequest.id}/status`)
                .set('Authorization', me.authHeader)
                .set('Cookie', me.cookie)
                .send({ statusNumber: statuses.FALSE });
            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/Недопустимый переход/i);
        });

        it('NEW_REQUEST(1) → AT_WORK(2) разрешён, 200', async () => {
            await myAssignedRequest.update({ status: statuses.NEW_REQUEST });
            const res = await request(app)
                .patch(`/lk/requests/${myAssignedRequest.id}/status`)
                .set('Authorization', me.authHeader)
                .set('Cookie', me.cookie)
                .send({ statusNumber: statuses.AT_WORK });
            expect(res.status).toBe(200);
            expect(res.body.status).toBe(statuses.AT_WORK);
        });

        it('AT_WORK → DONE без checkPhoto → 400; с checkPhoto → 200', async () => {
            await myAssignedRequest.update({ status: statuses.AT_WORK, checkPhoto: null });
            const denied = await request(app)
                .patch(`/lk/requests/${myAssignedRequest.id}/status`)
                .set('Authorization', me.authHeader)
                .set('Cookie', me.cookie)
                .send({ statusNumber: statuses.DONE });
            expect(denied.status).toBe(400);
            expect(denied.body.message).toMatch(/фото-подтверждения/i);

            await myAssignedRequest.update({ checkPhoto: 'check.jpg' });
            const ok = await request(app)
                .patch(`/lk/requests/${myAssignedRequest.id}/status`)
                .set('Authorization', me.authHeader)
                .set('Cookie', me.cookie)
                .send({ statusNumber: statuses.DONE });
            expect(ok.status).toBe(200);
            expect(ok.body.status).toBe(statuses.DONE);
        });
    });

    describe('LK-C1: pre-middleware UUID-валидация + cleanup uploads', () => {
        it('POST /photos с невалидным :id → 400, файлы НЕ остались на диске', async () => {
            const before = countUploads();
            const res = await request(app)
                .post('/lk/requests/not-uuid/photos')
                .set('Authorization', me.authHeader)
                .set('Cookie', me.cookie);
            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/Некорректный идентификатор/i);
            // Cleanup в errorHandler — асинхронный (fs.promises.unlink). Но при невалидном
            // UUID multer вообще не запускается (validateUuidParam стоит до него),
            // поэтому файлы не должны были создаваться.
            const after = countUploads();
            expect(after).toBe(before);
        });

        it('GET /requests/:id с невалидным :id → 400 на русском', async () => {
            const res = await request(app)
                .get('/lk/requests/not-uuid')
                .set('Authorization', me.authHeader)
                .set('Cookie', me.cookie);
            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/Некорректный идентификатор/i);
        });
    });

    describe('LK-H3: PUT /users/:id/objects валидирует existence', () => {
        it('несуществующий objectId → 400 «Один или несколько указанных объектов не найдены»', async () => {
            // Валидный UUID, но в БД его нет.
            const fakeObjectId = '00000000-0000-4000-8000-000000000001';
            const res = await request(app)
                .put(`/users/${me.user.id}/objects`)
                .set('Authorization', admin.authHeader)
                .set('Cookie', admin.cookie)
                .send({ objectIds: [fakeObjectId] });
            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/Один или несколько указанных объектов не найдены/i);
        });
    });
});
