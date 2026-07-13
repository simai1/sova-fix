import express, { RequestHandler } from 'express';
import httpStatus from 'http-status';
import request from 'supertest';
import { Op, WhereOptions } from 'sequelize';
import { v4 as uuid } from 'uuid';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import roles from '../../src/config/roles';
import errorHandler from '../../src/middlewares/errorHandler';
import {
    attachRequestScope,
    requireBulkRequestAccess,
    requireObjectBodyAccess,
    requireObjectParamAccess,
    requireRequestBodyAccess,
    requireRequestParamAccess,
} from '../../src/middlewares/require-admin-request-access';
import ObjectDir from '../../src/models/object';
import RepairRequest from '../../src/models/repairRequest';
import User from '../../src/models/user';
import UserObject from '../../src/models/userObject';
import {
    RequestScope,
    assertObjectAccess,
    getAdministrativeAudienceUserIds,
    loadAccessibleRequest,
    loadAccessibleRequests,
    loadRequestScope,
    scopeWhere,
} from '../../src/services/request-access.service';
import { createRequest, ensureBaseRefs } from '../helpers/lk-helper';

describe('request access service and guards', () => {
    const suffix = `${process.pid}-${Date.now()}`;
    const users: User[] = [];
    const objects: ObjectDir[] = [];
    const repairRequests: RepairRequest[] = [];
    let admin: User;
    let inactiveAdmin: User;
    let manager: User;
    let secondManager: User;
    let emptyManager: User;
    let softDeletedAssignmentManager: User;
    let inactiveManager: User;
    let customer: User;
    let objectA: ObjectDir;
    let objectB: ObjectDir;
    let foreignObject: ObjectDir;
    let assignedRequest: RepairRequest;
    let secondAssignedRequest: RepairRequest;
    let foreignRequest: RepairRequest;
    let requestWithoutObject: RepairRequest;
    let managerScope: RequestScope;
    let terminalHandlerCalls = 0;
    let app: express.Express;

    const createUser = async (name: string, role: number, isActivated = true): Promise<User> => {
        const user = await User.create({
            login: `scope-${users.length}-${suffix}@test.local`,
            password: 'x',
            name,
            role,
            isActivated,
        });
        users.push(user);
        return user;
    };

    const createObject = async (name: string): Promise<ObjectDir> => {
        const { legal, unit } = await ensureBaseRefs();
        const object = await ObjectDir.create({
            name: `${name}-${suffix}`,
            unitId: unit.id,
            legalEntityId: legal.id,
            city: 'Москва',
            number: 0,
        } as ObjectDir);
        objects.push(object);
        return object;
    };

    const trackRequest = (repairRequest: RepairRequest): RepairRequest => {
        repairRequests.push(repairRequest);
        return repairRequest;
    };

    const withScope =
        (scope: RequestScope): RequestHandler =>
        (req, _res, next) => {
            req.requestScope = scope;
            next();
        };

    const success =
        (body: (req: express.Request) => unknown): RequestHandler =>
        (req, res) => {
            terminalHandlerCalls += 1;
            res.json(body(req));
        };

    beforeAll(async () => {
        admin = await createUser('Scope Admin', roles.ADMIN);
        inactiveAdmin = await createUser('Scope Inactive Admin', roles.ADMIN, false);
        manager = await createUser('Scope Manager', roles.MANAGER);
        secondManager = await createUser('Scope Second Manager', roles.MANAGER);
        emptyManager = await createUser('Scope Empty Manager', roles.MANAGER);
        softDeletedAssignmentManager = await createUser('Scope Deleted Assignment Manager', roles.MANAGER);
        inactiveManager = await createUser('Scope Inactive Manager', roles.MANAGER, false);
        customer = await createUser('Scope Customer', roles.CUSTOMER);

        objectA = await createObject('Scope Object A');
        objectB = await createObject('Scope Object B');
        foreignObject = await createObject('Scope Foreign Object');

        await UserObject.bulkCreate([
            { userId: manager.id, objectId: objectA.id },
            { userId: manager.id, objectId: objectB.id },
            { userId: secondManager.id, objectId: objectA.id },
            { userId: inactiveManager.id, objectId: objectA.id },
        ]);
        const deletedAssignment = await UserObject.create({
            userId: softDeletedAssignmentManager.id,
            objectId: objectA.id,
        });
        await deletedAssignment.destroy();

        assignedRequest = trackRequest(await createRequest({ objectId: objectA.id }));
        secondAssignedRequest = trackRequest(await createRequest({ objectId: objectB.id }));
        foreignRequest = trackRequest(await createRequest({ objectId: foreignObject.id }));
        requestWithoutObject = trackRequest(await createRequest({ objectId: undefined }));
        managerScope = await loadRequestScope({ kind: 'web', userId: manager.id, role: roles.MANAGER });

        app = express();
        app.use(express.json());

        app.get(
            '/scope/manager',
            (req, _res, next) => {
                req.actor = { kind: 'web', userId: manager.id, role: roles.MANAGER };
                next();
            },
            attachRequestScope,
            attachRequestScope,
            success(req => req.requestScope)
        );
        app.get(
            '/scope/missing-actor',
            attachRequestScope,
            success(() => ({ ok: true }))
        );

        app.get(
            '/request-param/missing-field',
            withScope(managerScope),
            requireRequestParamAccess('id'),
            success(req => ({ id: req.repairRequest?.id }))
        );
        app.get(
            '/request-param-custom/:id',
            withScope(managerScope),
            requireRequestParamAccess('id'),
            success(req => ({ id: req.repairRequest?.id }))
        );
        app.get(
            '/request-param/:requestId',
            withScope(managerScope),
            requireRequestParamAccess(),
            success(req => ({ id: req.repairRequest?.id }))
        );
        app.get(
            '/request-param-without-scope/:requestId',
            requireRequestParamAccess(),
            success(req => ({ id: req.repairRequest?.id }))
        );

        app.post(
            '/request-body',
            withScope(managerScope),
            requireRequestBodyAccess(),
            success(req => ({ id: req.repairRequest?.id }))
        );
        app.post(
            '/request-body-custom',
            withScope(managerScope),
            requireRequestBodyAccess('id'),
            success(req => ({ id: req.repairRequest?.id }))
        );

        app.post(
            '/object-body',
            withScope(managerScope),
            requireObjectBodyAccess(),
            success(() => ({ ok: true }))
        );
        app.post(
            '/object-body-custom',
            withScope(managerScope),
            requireObjectBodyAccess('id'),
            success(() => ({ ok: true }))
        );
        app.post(
            '/object-body-all',
            withScope({ kind: 'all' }),
            requireObjectBodyAccess(),
            success(() => ({ ok: true }))
        );

        app.get(
            '/object-param/missing-field',
            withScope(managerScope),
            requireObjectParamAccess('id'),
            success(() => ({ ok: true }))
        );
        app.get(
            '/object-param-custom/:id',
            withScope(managerScope),
            requireObjectParamAccess('id'),
            success(() => ({ ok: true }))
        );
        app.get(
            '/object-param/:objectId',
            withScope(managerScope),
            requireObjectParamAccess(),
            success(() => ({ ok: true }))
        );

        app.post(
            '/bulk',
            withScope(managerScope),
            requireBulkRequestAccess(),
            success(req => ({ ids: req.scopedRequests?.map(row => row.id) }))
        );
        app.post(
            '/bulk-custom',
            withScope(managerScope),
            requireBulkRequestAccess('ids'),
            success(req => ({ ids: req.scopedRequests?.map(row => row.id) }))
        );

        app.use(errorHandler);
    });

    afterAll(async () => {
        await RepairRequest.destroy({ where: { id: repairRequests.map(row => row.id) }, force: true });
        await UserObject.destroy({ where: { userId: users.map(user => user.id) }, force: true });
        await User.destroy({ where: { id: users.map(user => user.id) }, force: true });
        await ObjectDir.destroy({ where: { id: objects.map(object => object.id) }, force: true });
    });

    describe('RequestScope service', () => {
        it('ограничивает Менеджера назначенными объектами и не расширяется клиентским where', async () => {
            expect(managerScope).toMatchObject({ kind: 'objects', userId: manager.id });
            if (managerScope.kind !== 'objects') throw new Error('Expected objects scope');
            expect(managerScope.objectIds).toHaveLength(2);
            expect(managerScope.objectIds).toEqual(expect.arrayContaining([objectA.id, objectB.id]));

            const rows = await RepairRequest.findAll({
                where: scopeWhere(managerScope, { id: [assignedRequest.id, foreignRequest.id] }),
            });

            expect(rows.map(({ id }) => id)).toEqual([assignedRequest.id]);
            await expect(loadAccessibleRequest(foreignRequest.id, managerScope)).rejects.toMatchObject({
                statusCode: httpStatus.FORBIDDEN,
                message: 'У вас нет доступа к этой заявке',
            });
        });

        it('сохраняет исходный where отдельным условием Op.and, чтобы фильтр мог только сужать scope', async () => {
            const callerWhere: WhereOptions = { objectId: foreignObject.id };
            const composed = scopeWhere(managerScope, callerWhere);
            const clauses = composed[Op.and] as WhereOptions[];

            expect(clauses[0]).toBe(callerWhere);
            expect(clauses[1]).toEqual({ objectId: { [Op.in]: [objectA.id, objectB.id] } });
            expect(await RepairRequest.count({ where: composed })).toBe(0);
            expect(scopeWhere({ kind: 'all' }, callerWhere)).toBe(callerWhere);
        });

        it('не превращает пустой или soft-deleted список назначений в полный доступ', async () => {
            const emptyScope = await loadRequestScope({
                kind: 'web',
                userId: emptyManager.id,
                role: roles.MANAGER,
            });
            const deletedScope = await loadRequestScope({
                kind: 'web',
                userId: softDeletedAssignmentManager.id,
                role: roles.MANAGER,
            });

            expect(emptyScope).toEqual({ kind: 'objects', userId: emptyManager.id, objectIds: [] });
            expect(deletedScope).toEqual({
                kind: 'objects',
                userId: softDeletedAssignmentManager.id,
                objectIds: [],
            });
            expect(await RepairRequest.count({ where: scopeWhere(emptyScope) })).toBe(0);
        });

        it('дедуплицирует objectIds при загрузке scope', async () => {
            const findAll = vi
                .spyOn(UserObject, 'findAll')
                .mockResolvedValueOnce([
                    { objectId: objectA.id },
                    { objectId: objectA.id },
                    { objectId: objectB.id },
                ] as UserObject[]);
            try {
                const scope = await loadRequestScope({ kind: 'web', userId: manager.id, role: roles.MANAGER });
                expect(scope).toEqual({
                    kind: 'objects',
                    userId: manager.id,
                    objectIds: [objectA.id, objectB.id],
                });
            } finally {
                findAll.mockRestore();
            }
        });

        it('даёт полный scope bot и web-акторам кроме Менеджера', async () => {
            await expect(loadRequestScope({ kind: 'bot' })).resolves.toEqual({ kind: 'all' });
            await expect(loadRequestScope({ kind: 'web', userId: admin.id, role: roles.ADMIN })).resolves.toEqual({
                kind: 'all',
            });
            await expect(loadRequestScope({ kind: 'web', userId: customer.id, role: roles.CUSTOMER })).resolves.toEqual(
                { kind: 'all' }
            );
        });

        it('разрешает любой objectId только для all scope и запрещает отсутствующий или чужой Менеджеру', () => {
            expect(() => assertObjectAccess(undefined, { kind: 'all' })).not.toThrow();
            expect(() => assertObjectAccess(undefined, managerScope)).toThrowError(
                expect.objectContaining({
                    statusCode: httpStatus.FORBIDDEN,
                    message: 'У вас нет доступа к этой заявке',
                })
            );
            expect(() => assertObjectAccess(foreignObject.id, managerScope)).toThrowError(
                expect.objectContaining({ statusCode: httpStatus.FORBIDDEN })
            );
            expect(() => assertObjectAccess(objectA.id, managerScope)).not.toThrow();
        });

        it('различает отсутствующую заявку, чужую заявку и заявку без объекта', async () => {
            await expect(loadAccessibleRequest(uuid(), managerScope)).rejects.toMatchObject({
                statusCode: httpStatus.NOT_FOUND,
            });
            await expect(loadAccessibleRequest(foreignRequest.id, managerScope)).rejects.toMatchObject({
                statusCode: httpStatus.FORBIDDEN,
            });
            await expect(loadAccessibleRequest(requestWithoutObject.id, managerScope)).rejects.toMatchObject({
                statusCode: httpStatus.FORBIDDEN,
            });
            await expect(loadAccessibleRequest(assignedRequest.id, managerScope)).resolves.toMatchObject({
                id: assignedRequest.id,
            });
        });

        it('нормализует и дедуплицирует bulk ids, загружая их одним запросом', async () => {
            const findAll = vi.spyOn(RepairRequest, 'findAll');
            try {
                const rows = await loadAccessibleRequests(
                    [` ${assignedRequest.id.toUpperCase()} `, assignedRequest.id, secondAssignedRequest.id],
                    managerScope
                );

                expect(findAll).toHaveBeenCalledTimes(1);
                expect(rows.map(row => row.id)).toEqual([assignedRequest.id, secondAssignedRequest.id]);
            } finally {
                findAll.mockRestore();
            }
        });

        it('отклоняет mixed bulk целиком и проверяет отсутствующие ids до чужих', async () => {
            await expect(
                loadAccessibleRequests([assignedRequest.id, foreignRequest.id], managerScope)
            ).rejects.toMatchObject({ statusCode: httpStatus.FORBIDDEN });
            await expect(loadAccessibleRequests([foreignRequest.id, uuid()], managerScope)).rejects.toMatchObject({
                statusCode: httpStatus.NOT_FOUND,
            });
        });

        it('возвращает активную административную аудиторию с учётом объекта и paranoid назначений', async () => {
            const objectAudience = await getAdministrativeAudienceUserIds(objectA.id);
            const generalAudience = await getAdministrativeAudienceUserIds();

            expect(objectAudience).toEqual(expect.arrayContaining([admin.id, manager.id, secondManager.id]));
            for (const excludedId of [
                emptyManager.id,
                softDeletedAssignmentManager.id,
                inactiveManager.id,
                inactiveAdmin.id,
                customer.id,
            ]) {
                expect(objectAudience).not.toContain(excludedId);
            }
            expect(new Set(objectAudience).size).toBe(objectAudience.length);

            expect(generalAudience).toEqual(
                expect.arrayContaining([
                    admin.id,
                    manager.id,
                    secondManager.id,
                    emptyManager.id,
                    softDeletedAssignmentManager.id,
                ])
            );
            for (const excludedId of [inactiveManager.id, inactiveAdmin.id, customer.id]) {
                expect(generalAudience).not.toContain(excludedId);
            }
            expect(new Set(generalAudience).size).toBe(generalAudience.length);
        });
    });

    describe('request access middleware', () => {
        it('attachRequestScope требует actor, загружает scope один раз и кеширует его', async () => {
            const beforeError = terminalHandlerCalls;
            const missingActor = await request(app).get('/scope/missing-actor');
            expect(missingActor.status).toBe(httpStatus.UNAUTHORIZED);
            expect(terminalHandlerCalls).toBe(beforeError);

            const findAll = vi.spyOn(UserObject, 'findAll');
            try {
                const response = await request(app).get('/scope/manager');
                expect(response.status).toBe(httpStatus.OK);
                expect(response.body).toMatchObject({ kind: 'objects', userId: manager.id });
                expect(findAll).toHaveBeenCalledTimes(1);
            } finally {
                findAll.mockRestore();
            }
        });

        it('requireRequestParamAccess валидирует default/custom param и кеширует заявку', async () => {
            const defaultResponse = await request(app).get(`/request-param/${assignedRequest.id}`);
            const customResponse = await request(app).get(`/request-param-custom/${assignedRequest.id}`);

            expect(defaultResponse.status).toBe(httpStatus.OK);
            expect(defaultResponse.body).toEqual({ id: assignedRequest.id });
            expect(customResponse.status).toBe(httpStatus.OK);
            expect(customResponse.body).toEqual({ id: assignedRequest.id });
        });

        it('requireRequestParamAccess возвращает 400/401/404/403 и не вызывает handler после ошибки', async () => {
            const cases = [
                ['/request-param/missing-field', httpStatus.BAD_REQUEST],
                ['/request-param/not-a-uuid', httpStatus.BAD_REQUEST],
                [`/request-param-without-scope/${assignedRequest.id}`, httpStatus.UNAUTHORIZED],
                [`/request-param/${uuid()}`, httpStatus.NOT_FOUND],
                [`/request-param/${foreignRequest.id}`, httpStatus.FORBIDDEN],
            ] as const;

            for (const [path, status] of cases) {
                const before = terminalHandlerCalls;
                const response = await request(app).get(path);
                expect(response.status).toBe(status);
                expect(terminalHandlerCalls).toBe(before);
            }
        });

        it('requireRequestBodyAccess читает только requestId, поддерживает custom field и не доверяет objectId', async () => {
            const defaultResponse = await request(app).post('/request-body').send({ requestId: assignedRequest.id });
            const customResponse = await request(app).post('/request-body-custom').send({ id: assignedRequest.id });
            const before = terminalHandlerCalls;
            const spoofed = await request(app)
                .post('/request-body')
                .send({ requestId: foreignRequest.id, objectId: objectA.id, requestScope: { kind: 'all' } });

            expect(defaultResponse.body).toEqual({ id: assignedRequest.id });
            expect(customResponse.body).toEqual({ id: assignedRequest.id });
            expect(spoofed.status).toBe(httpStatus.FORBIDDEN);
            expect(spoofed.body.message).toBe('У вас нет доступа к этой заявке');
            expect(terminalHandlerCalls).toBe(before);
        });

        it('requireRequestBodyAccess возвращает 400 для отсутствующего и malformed UUID', async () => {
            for (const body of [{}, { requestId: 'bad-id' }]) {
                const before = terminalHandlerCalls;
                const response = await request(app).post('/request-body').send(body);
                expect(response.status).toBe(httpStatus.BAD_REQUEST);
                expect(terminalHandlerCalls).toBe(before);
            }
        });

        it('requireObjectBodyAccess валидирует default/custom field и запрещает чужой объект', async () => {
            expect((await request(app).post('/object-body').send({ objectId: objectA.id })).status).toBe(httpStatus.OK);
            expect((await request(app).post('/object-body-custom').send({ id: objectA.id })).status).toBe(
                httpStatus.OK
            );

            for (const body of [{}, { objectId: 'bad-id' }, { objectId: foreignObject.id }]) {
                const before = terminalHandlerCalls;
                const response = await request(app).post('/object-body').send(body);
                expect(response.status).toBe(
                    body.objectId === foreignObject.id ? httpStatus.FORBIDDEN : httpStatus.BAD_REQUEST
                );
                expect(terminalHandlerCalls).toBe(before);
            }
        });

        it('requireObjectBodyAccess с all scope принимает любой валидный objectId без запроса к body/query', async () => {
            const response = await request(app).post('/object-body-all').send({ objectId: uuid() });
            expect(response.status).toBe(httpStatus.OK);
        });

        it('requireObjectParamAccess валидирует default/custom param и не вызывает handler после ошибки', async () => {
            expect((await request(app).get(`/object-param/${objectA.id}`)).status).toBe(httpStatus.OK);
            expect((await request(app).get(`/object-param-custom/${objectA.id}`)).status).toBe(httpStatus.OK);

            const cases = [
                ['/object-param/missing-field', httpStatus.BAD_REQUEST],
                ['/object-param/not-a-uuid', httpStatus.BAD_REQUEST],
                [`/object-param/${foreignObject.id}`, httpStatus.FORBIDDEN],
            ] as const;
            for (const [path, status] of cases) {
                const before = terminalHandlerCalls;
                const response = await request(app).get(path);
                expect(response.status).toBe(status);
                expect(terminalHandlerCalls).toBe(before);
            }
        });

        it('requireBulkRequestAccess валидирует default/custom field и кеширует дедуплицированные заявки', async () => {
            const ids = [assignedRequest.id, assignedRequest.id, secondAssignedRequest.id];
            const defaultResponse = await request(app).post('/bulk').send({ requestIds: ids });
            const customResponse = await request(app).post('/bulk-custom').send({ ids });

            expect(defaultResponse.status).toBe(httpStatus.OK);
            expect(defaultResponse.body).toEqual({ ids: [assignedRequest.id, secondAssignedRequest.id] });
            expect(customResponse.status).toBe(httpStatus.OK);
            expect(customResponse.body).toEqual({ ids: [assignedRequest.id, secondAssignedRequest.id] });
        });

        it('requireBulkRequestAccess отклоняет пустой/non-array/malformed/missing/foreign bulk без partial success', async () => {
            const cases: Array<{ body: unknown; status: number }> = [
                { body: {}, status: httpStatus.BAD_REQUEST },
                { body: { requestIds: assignedRequest.id }, status: httpStatus.BAD_REQUEST },
                { body: { requestIds: [] }, status: httpStatus.BAD_REQUEST },
                { body: { requestIds: [assignedRequest.id, 'bad-id'] }, status: httpStatus.BAD_REQUEST },
                { body: { requestIds: [assignedRequest.id, uuid()] }, status: httpStatus.NOT_FOUND },
                { body: { requestIds: [assignedRequest.id, foreignRequest.id] }, status: httpStatus.FORBIDDEN },
            ];

            for (const { body, status } of cases) {
                const before = terminalHandlerCalls;
                const response = await request(app).post('/bulk').send(body);
                expect(response.status).toBe(status);
                expect(terminalHandlerCalls).toBe(before);
            }
        });
    });
});
