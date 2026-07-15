import fs from 'fs';
import path from 'path';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

vi.mock('../../src/services/email.service', () => ({ default: vi.fn() }));

import app from '../../src/app';
import roles from '../../src/config/roles';
import ObjectDir from '../../src/models/object';
import RepairRequest from '../../src/models/repairRequest';
import Status from '../../src/models/status';
import TgUser from '../../src/models/tgUser';
import TgUserObject from '../../src/models/tgUserObject';
import Urgency from '../../src/models/urgency';
import UserObject from '../../src/models/userObject';
import { createAdminAuth, createManagerAuth, TestAdminAuth } from '../helpers/auth-helper';
import { cleanupByLogin, createRequest, createUserAuth, ensureBaseRefs, TestAuth } from '../helpers/lk-helper';

const uploadsDir = path.resolve('./uploads');
const uploadNames = (): string[] => (fs.existsSync(uploadsDir) ? fs.readdirSync(uploadsDir).sort() : []);

const waitForUploadNames = async (expected: string[]): Promise<void> => {
    for (let attempt = 0; attempt < 40; attempt += 1) {
        if (uploadNames().join('\n') === expected.join('\n')) return;
        await new Promise(resolve => setTimeout(resolve, 10));
    }
};

describe('Manager legacy /requests access scope', () => {
    const suffix = `${process.pid}-${Date.now()}`;
    const masterKey = `manager-requests-master-${suffix}`;
    const previousMasterKey = process.env.MASTER_API_KEY;
    const logins = {
        admin: `manager-requests-admin-${suffix}@test.local`,
        manager: `manager-requests-manager-${suffix}@test.local`,
        emptyManager: `manager-requests-empty-${suffix}@test.local`,
        observer: `manager-requests-observer-${suffix}@test.local`,
    };
    let admin: TestAdminAuth;
    let manager: TestAdminAuth;
    let emptyManager: TestAdminAuth;
    let observer: TestAuth;
    let assignedObject: ObjectDir;
    let foreignObject: ObjectDir;
    let assignedNew: RepairRequest;
    let assignedWork: RepairRequest;
    let foreignDone: RepairRequest;
    let legacyUser: TgUser;
    let urgencyName: string;

    const asManager = (method: 'get' | 'post' | 'patch' | 'delete', url: string) =>
        request(app)[method](url).set('Authorization', manager.authHeader);

    beforeAll(async () => {
        process.env.MASTER_API_KEY = masterKey;
        admin = await createAdminAuth(logins.admin);
        manager = await createManagerAuth(logins.manager);
        emptyManager = await createManagerAuth(logins.emptyManager);
        observer = await createUserAuth(logins.observer, roles.OBSERVER, `Observer ${suffix}`);
        const { legal, unit, urgency } = await ensureBaseRefs();
        urgencyName = urgency.name;
        assignedObject = await ObjectDir.create({
            name: `Manager requests assigned ${suffix}`,
            unitId: unit.id,
            legalEntityId: legal.id,
            city: 'Москва',
            number: 0,
        } as ObjectDir);
        foreignObject = await ObjectDir.create({
            name: `Manager requests foreign ${suffix}`,
            unitId: unit.id,
            legalEntityId: legal.id,
            city: 'Москва',
            number: 0,
        } as ObjectDir);
        await UserObject.create({ userId: manager.user.id, objectId: assignedObject.id });
        assignedNew = await createRequest({
            objectId: assignedObject.id,
            status: 1,
            problemDescription: `assigned-new-${suffix}`,
        });
        assignedWork = await createRequest({
            objectId: assignedObject.id,
            status: 2,
            problemDescription: `assigned-work-${suffix}`,
        });
        foreignDone = await createRequest({
            objectId: foreignObject.id,
            status: 3,
            problemDescription: `foreign-done-${suffix}`,
        });
        legacyUser = await TgUser.create({
            name: `Manager requests legacy ${suffix}`,
            role: 3,
            tgId: `manager-requests-${suffix}`,
            isConfirmed: true,
        });
        await TgUserObject.bulkCreate([
            { tgUserId: legacyUser.id, objectId: assignedObject.id },
            { tgUserId: legacyUser.id, objectId: foreignObject.id },
        ]);
    });

    afterAll(async () => {
        await RepairRequest.destroy({
            where: { objectId: [assignedObject.id, foreignObject.id] },
            force: true,
        });
        await TgUserObject.destroy({ where: { tgUserId: legacyUser.id }, force: true });
        await TgUser.destroy({ where: { id: legacyUser.id }, force: true });
        await UserObject.destroy({ where: { userId: [manager.user.id, emptyManager.user.id] }, force: true });
        await ObjectDir.destroy({ where: { id: [assignedObject.id, foreignObject.id] }, force: true });
        for (const login of Object.values(logins)) await cleanupByLogin(login);
        if (previousMasterKey === undefined) delete process.env.MASTER_API_KEY;
        else process.env.MASTER_API_KEY = previousMasterKey;
    });

    it('ограничивает list, count и stats назначенными объектами', async () => {
        const [list, count, stats] = await Promise.all([
            asManager('get', '/requests'),
            asManager('get', '/requests/count'),
            asManager('get', '/requests/stats'),
        ]);

        expect(list.status).toBe(200);
        expect(list.body.data.map((row: { id: string }) => row.id)).toEqual(
            expect.arrayContaining([assignedNew.id, assignedWork.id])
        );
        expect(list.body.data.map((row: { id: string }) => row.id)).not.toContain(foreignDone.id);
        expect(count.status).toBe(200);
        expect(count.body.response).toEqual({ newRequests: 1, inWorkRequests: 1, doneRequests: 0 });
        expect(stats.status).toBe(200);
        expect(stats.body).toEqual({ NEW_REQUEST: 1, AT_WORK: 1, DONE: 0 });
    });

    it('возвращает пустые totals Менеджеру без объектов', async () => {
        const auth = { Authorization: emptyManager.authHeader };
        const [list, count, stats] = await Promise.all([
            request(app).get('/requests').set(auth),
            request(app).get('/requests/count').set(auth),
            request(app).get('/requests/stats').set(auth),
        ]);

        expect(list.status).toBe(200);
        expect(list.body).toEqual({ maxCount: 0, data: [] });
        expect(count.body.response).toEqual({ newRequests: 0, inWorkRequests: 0, doneRequests: 0 });
        expect(stats.body).toEqual({ NEW_REQUEST: 0, AT_WORK: 0, DONE: 0 });
    });

    it('сохраняет Наблюдателю read-only доступ ко всем заявкам и агрегатам', async () => {
        const auth = { Authorization: observer.authHeader };
        const [list, count, stats, detail, files, customerList, objectList, actualList] = await Promise.all([
            request(app).get('/requests').set(auth),
            request(app).get('/requests/count').set(auth),
            request(app).get('/requests/stats').set(auth),
            request(app).get(`/requests/${foreignDone.id}`).set(auth),
            request(app).get(`/requests/files/${foreignDone.id}`).set(auth),
            request(app).get(`/requests/customer/${legacyUser.id}`).set(auth),
            request(app).get(`/requests/objects/${legacyUser.id}`).set(auth),
            request(app).get(`/requests/actual/${legacyUser.id}/${assignedObject.unitId}`).set(auth),
        ]);

        expect(list.status).toBe(200);
        expect(list.body.data.map((row: { id: string }) => row.id)).toEqual(
            expect.arrayContaining([assignedNew.id, assignedWork.id, foreignDone.id])
        );
        expect(count.status).toBe(200);
        expect(stats.status).toBe(200);
        expect(detail.status).toBe(200);
        expect(detail.body.id).toBe(foreignDone.id);
        expect([files, customerList, objectList, actualList].map(response => response.status)).toEqual([
            200, 200, 200, 200,
        ]);
    });

    it('запрещает Наблюдателю все изменяющие маршруты заявок', async () => {
        const auth = { Authorization: observer.authHeader };
        const beforeUploads = uploadNames();
        const beforeCount = await RepairRequest.count({
            where: { objectId: [assignedObject.id, foreignObject.id] },
        });
        const initialComment = foreignDone.comment ?? null;
        const cases: Array<{ method: 'post' | 'patch' | 'delete'; url: string }> = [
            { method: 'post', url: '/requests' },
            { method: 'post', url: '/requests/without-photo' },
            { method: 'post', url: '/requests/multiple-photos' },
            { method: 'delete', url: `/requests/${foreignDone.id}/delete` },
            { method: 'patch', url: `/requests/${foreignDone.id}/update` },
            { method: 'patch', url: '/requests/remove/contractor' },
            { method: 'patch', url: '/requests/remove/extContractor' },
            { method: 'patch', url: '/requests/set/extContractor' },
            { method: 'patch', url: '/requests/set/contractor' },
            { method: 'patch', url: '/requests/set/manager' },
            { method: 'patch', url: '/requests/set/status' },
            { method: 'patch', url: '/requests/set/comment' },
            { method: 'patch', url: '/requests/set/commentAttachment' },
            { method: 'post', url: '/requests/delete/bulk' },
            { method: 'patch', url: '/requests/status/bulk' },
            { method: 'patch', url: '/requests/urgency/bulk' },
            { method: 'patch', url: '/requests/contractor/bulk' },
            { method: 'patch', url: `/requests/add/check/${foreignDone.id}` },
            { method: 'post', url: `/requests/copy/${foreignDone.id}` },
            { method: 'post', url: '/requests/changeUrgency' },
            { method: 'post', url: '/requests/changeStatus' },
            { method: 'post', url: `/requests/directoryCategory/${foreignDone.id}` },
            { method: 'post', url: '/requests/migrate/manager-ids' },
            { method: 'post', url: '/requests/validate/manager-ids' },
        ];

        for (const testCase of cases) {
            const response = await request(app)[testCase.method](testCase.url).set(auth);
            expect(response.status, `${testCase.method.toUpperCase()} ${testCase.url}`).toBe(403);
        }
        await foreignDone.reload();
        expect(foreignDone.comment ?? null).toBe(initialComment);
        expect(await RepairRequest.count({ where: { objectId: [assignedObject.id, foreignObject.id] } })).toBe(
            beforeCount
        );
        expect(uploadNames()).toEqual(beforeUploads);
    });

    it('не расширяет scope через userId и legacy tgUserId', async () => {
        const [spoofedList, customerList, objectList, actualList] = await Promise.all([
            asManager('get', `/requests?userId=${admin.user.id}`),
            asManager('get', `/requests/customer/${legacyUser.id}`),
            asManager('get', `/requests/objects/${legacyUser.id}`),
            asManager('get', `/requests/actual/${legacyUser.id}/${assignedObject.unitId}`),
        ]);

        for (const response of [spoofedList, customerList, objectList]) {
            expect(response.status).toBe(200);
            const rows = response.body.data ?? response.body;
            expect(rows.map((row: { id: string }) => row.id)).not.toContain(foreignDone.id);
        }
        expect(actualList.status).toBe(200);
        expect(actualList.body.requests.map((row: { id: string }) => row.id)).not.toContain(foreignDone.id);
    });

    it('запрещает чтения и param-мутации чужой заявки до controller', async () => {
        const fakeCategoryId = '00000000-0000-4000-8000-000000000001';
        const responses = await Promise.all([
            asManager('get', `/requests/${foreignDone.id}`),
            asManager('patch', `/requests/${foreignDone.id}/update`).send({ problemDescription: 'forbidden' }),
            asManager('delete', `/requests/${foreignDone.id}/delete`),
            asManager('post', `/requests/copy/${foreignDone.id}`),
            asManager('get', `/requests/files/${foreignDone.id}`),
            asManager('patch', `/requests/add/check/${foreignDone.id}`),
            asManager('post', `/requests/directoryCategory/${foreignDone.id}`).send({
                directoryCategoryId: fakeCategoryId,
            }),
        ]);

        expect(responses.map(response => response.status)).toEqual([403, 403, 403, 403, 403, 403, 403]);
        await foreignDone.reload();
        expect(foreignDone.problemDescription).toBe(`foreign-done-${suffix}`);
    });

    it('запрещает все body-мутации чужой заявки', async () => {
        const fakeId = '00000000-0000-4000-8000-000000000001';
        const cases: Array<{ url: string; body: Record<string, unknown> }> = [
            { url: '/requests/remove/contractor', body: { requestId: foreignDone.id } },
            { url: '/requests/remove/extContractor', body: { requestId: foreignDone.id } },
            {
                url: '/requests/set/extContractor',
                body: { requestId: foreignDone.id, extContractorId: fakeId },
            },
            { url: '/requests/set/contractor', body: { requestId: foreignDone.id, contractorId: fakeId } },
            { url: '/requests/set/manager', body: { requestId: foreignDone.id, managerId: fakeId } },
            { url: '/requests/set/status', body: { requestId: foreignDone.id, status: 1 } },
            { url: '/requests/set/comment', body: { requestId: foreignDone.id, comment: 'forbidden' } },
        ];

        for (const testCase of cases) {
            const response = await asManager('patch', testCase.url).send(testCase.body);
            expect(response.status, testCase.url).toBe(403);
        }
        await foreignDone.reload();
        expect(foreignDone.comment).not.toBe('forbidden');
    });

    it('проверяет object scope во всех create variants и при переносе заявки', async () => {
        const before = uploadNames();
        const [withoutPhoto, withPhoto, withPhotos, moved] = await Promise.all([
            asManager('post', '/requests/without-photo').send({
                objectId: foreignObject.id,
                urgency: urgencyName,
            }),
            asManager('post', '/requests')
                .field('objectId', foreignObject.id)
                .field('urgency', urgencyName)
                .attach('file', Buffer.from('foreign-one'), 'foreign-one.png'),
            asManager('post', '/requests/multiple-photos')
                .field('objectId', foreignObject.id)
                .field('urgency', urgencyName)
                .attach('file', Buffer.from('foreign-two'), 'foreign-two.png')
                .attach('file', Buffer.from('foreign-three'), 'foreign-three.png'),
            asManager('patch', `/requests/${assignedNew.id}/update`).send({ objectId: foreignObject.id }),
        ]);

        expect([withoutPhoto, withPhoto, withPhotos, moved].map(response => response.status)).toEqual([
            403, 403, 403, 403,
        ]);
        await assignedNew.reload();
        expect(assignedNew.objectId).toBe(assignedObject.id);
        await waitForUploadNames(before);
        expect(uploadNames()).toEqual(before);
    });

    it('очищает commentAttachment чужой заявки после 403', async () => {
        const before = uploadNames();
        const response = await asManager('patch', '/requests/set/commentAttachment')
            .field('requestId', foreignDone.id)
            .attach('file', Buffer.from('foreign-comment'), 'foreign-comment.png');

        expect(response.status).toBe(403);
        await waitForUploadNames(before);
        expect(uploadNames()).toEqual(before);
    });

    it('делает mixed bulk access-preflight до первой мутации', async () => {
        const initialAssignedStatus = assignedWork.status;
        const initialForeignStatus = foreignDone.status;
        const initialAssignedUrgency = assignedWork.urgency;
        const initialForeignUrgency = foreignDone.urgency;
        const fakeContractorId = '00000000-0000-4000-8000-000000000001';
        const ids = [assignedWork.id, foreignDone.id];
        const responses = await Promise.all([
            asManager('patch', '/requests/status/bulk').send({ ids, status: 4 }),
            asManager('patch', '/requests/urgency/bulk').send({ ids, urgency: 'forbidden' }),
            asManager('patch', '/requests/contractor/bulk').send({ ids, contractorId: fakeContractorId }),
            asManager('post', '/requests/delete/bulk').send({ ids }),
        ]);

        expect(responses.map(response => response.status)).toEqual([403, 403, 403, 403]);
        await Promise.all([assignedWork.reload(), foreignDone.reload()]);
        expect(assignedWork.status).toBe(initialAssignedStatus);
        expect(foreignDone.status).toBe(initialForeignStatus);
        expect(assignedWork.urgency).toBe(initialAssignedUrgency);
        expect(foreignDone.urgency).toBe(initialForeignUrgency);
        expect(assignedWork.contractorId).toBeNull();
        expect(foreignDone.contractorId).toBeNull();
    });

    it('разрешает Manager mutation назначенной заявки, а Admin и bot — foreign mutation и bulk', async () => {
        const assignedComment = assignedNew.comment ?? null;
        const foreignComment = foreignDone.comment ?? null;
        const foreignUrgency = foreignDone.urgency;

        try {
            const managerMutation = await asManager('patch', '/requests/set/comment').send({
                requestId: assignedNew.id,
                comment: `manager-mutation-${suffix}`,
            });
            expect(managerMutation.status).toBe(200);
            await assignedNew.reload();
            expect(assignedNew.comment).toBe(`manager-mutation-${suffix}`);

            const adminMutation = await request(app)
                .patch('/requests/set/comment')
                .set('Authorization', admin.authHeader)
                .send({ requestId: foreignDone.id, comment: `admin-mutation-${suffix}` });
            expect(adminMutation.status).toBe(200);
            await foreignDone.reload();
            expect(foreignDone.comment).toBe(`admin-mutation-${suffix}`);

            const botMutation = await request(app)
                .patch('/requests/set/comment')
                .set('master-api-key', masterKey)
                .send({ requestId: foreignDone.id, comment: `bot-mutation-${suffix}` });
            expect(botMutation.status).toBe(200);
            await foreignDone.reload();
            expect(foreignDone.comment).toBe(`bot-mutation-${suffix}`);

            const adminBulk = await request(app)
                .patch('/requests/urgency/bulk')
                .set('Authorization', admin.authHeader)
                .send({ ids: [foreignDone.id], urgency: `admin-bulk-${suffix}` });
            expect(adminBulk.status).toBe(200);
            await foreignDone.reload();
            expect(foreignDone.urgency).toBe(`admin-bulk-${suffix}`);

            const botBulk = await request(app)
                .patch('/requests/urgency/bulk')
                .set('master-api-key', masterKey)
                .send({ ids: [foreignDone.id], urgency: `bot-bulk-${suffix}` });
            expect(botBulk.status).toBe(200);
            await foreignDone.reload();
            expect(foreignDone.urgency).toBe(`bot-bulk-${suffix}`);
        } finally {
            await Promise.all([
                assignedNew.update({ comment: assignedComment }),
                foreignDone.update({ comment: foreignComment, urgency: foreignUrgency }),
            ]);
        }
    });

    it('сохраняет глобальную семантику changeUrgency и changeStatus для Manager', async () => {
        const assignedSnapshot = {
            urgency: assignedNew.urgency,
            urgencyId: assignedNew.urgencyId ?? null,
            status: assignedNew.status,
            statusId: assignedNew.statusId ?? null,
        };
        const foreignSnapshot = {
            urgency: foreignDone.urgency,
            urgencyId: foreignDone.urgencyId ?? null,
            status: foreignDone.status,
            statusId: foreignDone.statusId ?? null,
        };
        const sourceUrgency = `global-source-${suffix}`;
        const sourceStatus = 29999;
        let targetUrgency: Urgency | null = null;
        let targetStatus: Status | null = null;

        try {
            targetUrgency = await Urgency.create({
                name: `global-target-${suffix}`,
                color: '#fff',
                number: 0,
            } as Urgency);
            targetStatus = await Status.create({
                name: `global-target-${suffix}`,
                color: '#fff',
                number: 0,
            } as Status);
            await Promise.all([
                assignedNew.update({ urgency: sourceUrgency, urgencyId: null, status: sourceStatus, statusId: null }),
                foreignDone.update({ urgency: sourceUrgency, urgencyId: null, status: sourceStatus, statusId: null }),
            ]);

            const urgencyResponse = await asManager('post', '/requests/changeUrgency').send({
                prevName: sourceUrgency,
                urgencyId: targetUrgency.id,
            });
            expect(urgencyResponse.status).toBe(200);
            await Promise.all([assignedNew.reload(), foreignDone.reload()]);
            expect([assignedNew.urgency, foreignDone.urgency]).toEqual([targetUrgency.name, targetUrgency.name]);
            expect([assignedNew.urgencyId, foreignDone.urgencyId]).toEqual([targetUrgency.id, targetUrgency.id]);

            const statusResponse = await asManager('post', '/requests/changeStatus').send({
                prevNumber: sourceStatus,
                statusId: targetStatus.id,
            });
            expect(statusResponse.status).toBe(200);
            await Promise.all([assignedNew.reload(), foreignDone.reload()]);
            expect([assignedNew.status, foreignDone.status]).toEqual([targetStatus.number, targetStatus.number]);
            expect([assignedNew.statusId, foreignDone.statusId]).toEqual([targetStatus.id, targetStatus.id]);
        } finally {
            await Promise.all([assignedNew.update(assignedSnapshot), foreignDone.update(foreignSnapshot)]);
            if (targetStatus) await targetStatus.destroy({ force: true });
            if (targetUrgency) await targetUrgency.destroy({ force: true });
        }
    });

    it('web create использует actor userId, а bot сохраняет legacy createdBy', async () => {
        const webResponse = await asManager('post', '/requests/without-photo').send({
            objectId: assignedObject.id,
            urgency: urgencyName,
        });
        const botResponse = await request(app)
            .post('/requests/without-photo')
            .set('master-api-key', masterKey)
            .send({ objectId: foreignObject.id, urgency: urgencyName, tgUserId: legacyUser.id });

        expect(webResponse.status).toBe(200);
        expect(botResponse.status).toBe(200);
        const [webRequest, botRequest] = await Promise.all([
            RepairRequest.findByPk(webResponse.body.requestDto.id),
            RepairRequest.findByPk(botResponse.body.requestDto.id),
        ]);
        expect(webRequest?.createdByUserId).toBe(manager.user.id);
        expect(webRequest?.createdBy).toBeNull();
        expect(botRequest?.createdBy).toBe(legacyUser.id);
        expect(botRequest?.createdByUserId).toBeNull();
    });

    it('Admin и bot сохраняют полный доступ к чужому для Manager объекту', async () => {
        const [adminResponse, botResponse] = await Promise.all([
            request(app).get(`/requests/${foreignDone.id}`).set('Authorization', admin.authHeader),
            request(app).get(`/requests/${foreignDone.id}`).set('master-api-key', masterKey),
        ]);

        expect(adminResponse.status).toBe(200);
        expect(botResponse.status).toBe(200);
        expect(adminResponse.body.id).toBe(foreignDone.id);
        expect(botResponse.body.id).toBe(foreignDone.id);
    });
});
