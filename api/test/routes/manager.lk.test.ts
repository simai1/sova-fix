import fs from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import roles from '../../src/config/roles';
import statuses from '../../src/config/statuses';
import ObjectDir from '../../src/models/object';
import RepairRequest from '../../src/models/repairRequest';
import RequestComment from '../../src/models/requestComment';
import UserObject from '../../src/models/userObject';
import lkService from '../../src/services/lk.service';
import { createManagerAuth, TestAdminAuth } from '../helpers/auth-helper';
import {
    cleanupByLogin,
    createContractorFor,
    createObjectFor,
    createRequest,
    createUserAuth,
    ensureBaseRefs,
    TestAuth,
} from '../helpers/lk-helper';

const uploadsDir = path.resolve('./uploads');

const removeUpload = (filename: string | null | undefined): void => {
    if (!filename) return;
    const fullPath = path.join(uploadsDir, filename);
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
};

describe('LK Manager object scope', () => {
    const managerLogin = 'lk-manager@t.local';
    const otherLogin = 'lk-manager-other@t.local';
    let manager: TestAdminAuth;
    let other: TestAuth;
    let assignedObject: ObjectDir;
    let foreignObject: ObjectDir;
    let assignedRequest: RepairRequest;
    let foreignRequest: RepairRequest;
    let urgencyId: string;
    const createdRequestIds: string[] = [];
    const uploadedFiles: string[] = [];

    beforeAll(async () => {
        const refs = await ensureBaseRefs();
        urgencyId = refs.urgency.id;
        await cleanupByLogin(managerLogin);
        await cleanupByLogin(otherLogin);

        manager = await createManagerAuth(managerLogin);
        other = await createUserAuth(otherLogin, roles.CUSTOMER, 'Manager LK Other');
        const managerContractor = await createContractorFor(manager.user);

        assignedObject = await createObjectFor(manager.user, 'ManagerAssigned');
        foreignObject = await createObjectFor(other.user, 'ManagerForeign');
        assignedRequest = await createRequest({
            objectId: assignedObject.id,
            createdByUserId: other.user.id,
            status: statuses.NEW_REQUEST,
        });
        foreignRequest = await createRequest({
            objectId: foreignObject.id,
            createdByUserId: manager.user.id,
            contractorId: managerContractor.id,
            status: statuses.NEW_REQUEST,
        });
    });

    afterAll(async () => {
        for (const filename of uploadedFiles) removeUpload(filename);
        await RequestComment.destroy({
            where: { requestId: [assignedRequest.id, foreignRequest.id, ...createdRequestIds] },
            force: true,
        });
        await RepairRequest.destroy({
            where: { id: [assignedRequest.id, foreignRequest.id, ...createdRequestIds] },
            force: true,
        });
        await ObjectDir.destroy({ where: { id: [assignedObject.id, foreignObject.id] }, force: true });
        await cleanupByLogin(managerLogin);
        await cleanupByLogin(otherLogin);
    });

    it('принимает MANAGER в /lk/me, /lk/objects/my и protected router', async () => {
        const [me, objects, card] = await Promise.all([
            request(app).get('/lk/me').set('Authorization', manager.authHeader).set('Cookie', manager.cookie),
            request(app).get('/lk/objects/my').set('Authorization', manager.authHeader).set('Cookie', manager.cookie),
            request(app)
                .get(`/lk/requests/${assignedRequest.id}`)
                .set('Authorization', manager.authHeader)
                .set('Cookie', manager.cookie),
        ]);

        expect(me.status).toBe(200);
        expect(me.body.user.role).toBe('MANAGER');
        expect(objects.status).toBe(200);
        expect(objects.body.map((object: { id: string }) => object.id)).toContain(assignedObject.id);
        expect(card.status).toBe(200);
        expect(card.body.id).toBe(assignedRequest.id);
    });

    it('список ограничен назначенными объектами независимо от query role и objectId только сужает scope', async () => {
        for (const role of ['customer', 'contractor']) {
            const response = await request(app)
                .get(`/lk/requests?role=${role}&limit=100`)
                .set('Authorization', manager.authHeader)
                .set('Cookie', manager.cookie);
            expect(response.status).toBe(200);
            const ids = response.body.items.map((item: { id: string }) => item.id);
            expect(ids).toContain(assignedRequest.id);
            expect(ids).not.toContain(foreignRequest.id);
        }

        const foreignFilter = await request(app)
            .get(`/lk/requests?role=customer&objectId=${foreignObject.id}&limit=100`)
            .set('Authorization', manager.authHeader)
            .set('Cookie', manager.cookie);
        expect(foreignFilter.status).toBe(200);
        expect(foreignFilter.body.items).toEqual([]);
        expect(foreignFilter.body.total).toBe(0);
    });

    it('canRead/canWrite MANAGER зависят только от objectIds', () => {
        const assignedCtx = { contractor: null, objectIds: [assignedObject.id], userId: manager.user.id };
        const emptyCtx = { contractor: null, objectIds: [], userId: manager.user.id };

        expect(lkService.canRead(assignedRequest, 'MANAGER', assignedCtx)).toBe(true);
        expect(lkService.canWrite(assignedRequest, 'MANAGER', assignedCtx)).toBe(true);
        expect(lkService.canRead(foreignRequest, 'MANAGER', assignedCtx)).toBe(false);
        expect(lkService.canWrite(foreignRequest, 'MANAGER', assignedCtx)).toBe(false);
        expect(lkService.canRead(foreignRequest, 'MANAGER', emptyCtx)).toBe(false);
        expect(lkService.canWrite(foreignRequest, 'MANAGER', emptyCtx)).toBe(false);
    });

    it('разрешает чат и admin-like изменения назначенной заявки с ролью автора MANAGER', async () => {
        const comments = await request(app)
            .get(`/lk/requests/${assignedRequest.id}/comments`)
            .set('Authorization', manager.authHeader)
            .set('Cookie', manager.cookie);
        expect(comments.status).toBe(200);

        const comment = await request(app)
            .post(`/lk/requests/${assignedRequest.id}/comments`)
            .set('Authorization', manager.authHeader)
            .set('Cookie', manager.cookie)
            .field('text', 'Комментарий менеджера');
        expect(comment.status).toBe(201);
        expect(comment.body.author.role).toBe(roles.MANAGER);
        expect(comment.body.author.roleName).toBe('MANAGER');

        const photos = await request(app)
            .post(`/lk/requests/${assignedRequest.id}/photos`)
            .set('Authorization', manager.authHeader)
            .set('Cookie', manager.cookie)
            .attach('files', Buffer.from('manager-photo'), { filename: 'manager.png', contentType: 'image/png' });
        expect(photos.status).toBe(200);
        const storedAfterPhotos = await RepairRequest.findByPk(assignedRequest.id);
        const storedNames = storedAfterPhotos?.fileName?.startsWith('[')
            ? JSON.parse(storedAfterPhotos.fileName)
            : [storedAfterPhotos?.fileName];
        storedNames.filter(Boolean).forEach((name: string) => uploadedFiles.push(name));

        const status = await request(app)
            .patch(`/lk/requests/${assignedRequest.id}/status`)
            .set('Authorization', manager.authHeader)
            .set('Cookie', manager.cookie)
            .send({ statusNumber: statuses.AT_WORK });
        expect(status.status).toBe(200);
        expect(status.body.status).toBe(statuses.AT_WORK);

        const checkPhoto = await request(app)
            .post(`/lk/requests/${assignedRequest.id}/check-photo`)
            .set('Authorization', manager.authHeader)
            .set('Cookie', manager.cookie)
            .attach('file', Buffer.from('manager-check'), { filename: 'check.png', contentType: 'image/png' });
        expect(checkPhoto.status).toBe(200);
        const storedAfterCheck = await RepairRequest.findByPk(assignedRequest.id);
        if (storedAfterCheck?.checkPhoto) uploadedFiles.push(storedAfterCheck.checkPhoto);

        const exitDate = await request(app)
            .patch(`/lk/requests/${assignedRequest.id}/exit-date`)
            .set('Authorization', manager.authHeader)
            .set('Cookie', manager.cookie)
            .send({ exitDate: '2026-07-13T09:00:00.000Z' });
        expect(exitDate.status).toBe(200);
        expect(exitDate.body.exitDate).toBeTruthy();
    });

    it('все read/write операции по заявке чужого объекта возвращают 403', async () => {
        const calls = [
            request(app)
                .get(`/lk/requests/${foreignRequest.id}`)
                .set('Authorization', manager.authHeader)
                .set('Cookie', manager.cookie),
            request(app)
                .get(`/lk/requests/${foreignRequest.id}/comments`)
                .set('Authorization', manager.authHeader)
                .set('Cookie', manager.cookie),
            request(app)
                .post(`/lk/requests/${foreignRequest.id}/comments`)
                .set('Authorization', manager.authHeader)
                .set('Cookie', manager.cookie)
                .field('text', 'Нельзя'),
            request(app)
                .post(`/lk/requests/${foreignRequest.id}/photos`)
                .set('Authorization', manager.authHeader)
                .set('Cookie', manager.cookie)
                .attach('files', Buffer.from('foreign'), { filename: 'foreign.png', contentType: 'image/png' }),
            request(app)
                .patch(`/lk/requests/${foreignRequest.id}/status`)
                .set('Authorization', manager.authHeader)
                .set('Cookie', manager.cookie)
                .send({ statusNumber: statuses.AT_WORK }),
            request(app)
                .post(`/lk/requests/${foreignRequest.id}/check-photo`)
                .set('Authorization', manager.authHeader)
                .set('Cookie', manager.cookie)
                .attach('file', Buffer.from('foreign'), { filename: 'foreign.png', contentType: 'image/png' }),
            request(app)
                .patch(`/lk/requests/${foreignRequest.id}/exit-date`)
                .set('Authorization', manager.authHeader)
                .set('Cookie', manager.cookie)
                .send({ exitDate: '2026-07-13T09:00:00.000Z' }),
        ];

        const responses = await Promise.all(calls);
        expect(responses.map(response => response.status)).toEqual([403, 403, 403, 403, 403, 403, 403]);
    });

    it('создаёт заявку только на назначенном объекте', async () => {
        const assigned = await request(app)
            .post('/lk/requests')
            .set('Authorization', manager.authHeader)
            .set('Cookie', manager.cookie)
            .send({
                objectId: assignedObject.id,
                problemDescription: 'Заявка менеджера',
                urgencyId,
            });
        expect(assigned.status).toBe(201);
        expect(assigned.body.objectId).toBe(assignedObject.id);
        expect(assigned.body.createdByUserId).toBe(manager.user.id);
        createdRequestIds.push(assigned.body.id);

        const foreign = await request(app)
            .post('/lk/requests')
            .set('Authorization', manager.authHeader)
            .set('Cookie', manager.cookie)
            .send({
                objectId: foreignObject.id,
                problemDescription: 'Чужой объект',
                urgencyId,
            });
        expect(foreign.status).toBe(403);
    });

    it('удаление UserObject видно на следующем API-вызове', async () => {
        await UserObject.destroy({ where: { userId: manager.user.id, objectId: assignedObject.id }, force: true });

        const denied = await request(app)
            .get(`/lk/requests/${assignedRequest.id}`)
            .set('Authorization', manager.authHeader)
            .set('Cookie', manager.cookie);
        expect(denied.status).toBe(403);

        await UserObject.create({ userId: manager.user.id, objectId: assignedObject.id });
    });
});
