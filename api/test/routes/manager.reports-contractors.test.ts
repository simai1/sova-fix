import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

vi.mock('../../src/services/email.service', () => ({ default: vi.fn() }));

import app from '../../src/app';
import roles from '../../src/config/roles';
import Contractor from '../../src/models/contractor';
import ObjectDir from '../../src/models/object';
import RepairRequest from '../../src/models/repairRequest';
import Unit from '../../src/models/unit';
import UserObject from '../../src/models/userObject';
import { createAdminAuth, createManagerAuth, TestAdminAuth } from '../helpers/auth-helper';
import {
    cleanupByLogin,
    createContractorFor,
    createRequest,
    createUserAuth,
    ensureBaseRefs,
    TestAuth,
} from '../helpers/lk-helper';

type ReportBody = {
    parametrs: Record<string, boolean>;
    indicators: Record<string, boolean>;
    additionalParametrs: {
        isResult: boolean;
        reportType: number;
        dynamicsTypes: string[];
        dateStart?: string;
        dateEnd?: string;
    };
    filterData: Record<string, string[]> | null;
};

describe('Manager contractor-derived requests and reports scope', () => {
    const suffix = `${process.pid}-${Date.now()}`;
    const masterKey = `manager-reports-master-${suffix}`;
    const previousMasterKey = process.env.MASTER_API_KEY;
    const assignedBuilder = `Assigned builder ${suffix}`;
    const foreignBuilder = `Foreign builder ${suffix}`;
    const logins = {
        admin: `manager-reports-admin-${suffix}@test.local`,
        manager: `manager-reports-manager-${suffix}@test.local`,
        emptyManager: `manager-reports-empty-${suffix}@test.local`,
        observer: `manager-reports-observer-${suffix}@test.local`,
        customer: `manager-reports-customer-${suffix}@test.local`,
        contractor: `manager-reports-contractor-${suffix}@test.local`,
    };
    let admin: TestAdminAuth;
    let manager: TestAdminAuth;
    let emptyManager: TestAdminAuth;
    let observer: TestAuth;
    let customer: TestAuth;
    let contractorUser: TestAuth;
    let contractor: Contractor;
    let assignedObject: ObjectDir;
    let secondAssignedObject: ObjectDir;
    let foreignObject: ObjectDir;
    let secondAssignedUnit: Unit;
    let assignedRequest: RepairRequest;
    let secondAssignedRequest: RepairRequest;
    let foreignRequest: RepairRequest;

    const asWeb = (auth: TestAdminAuth | TestAuth, method: 'get' | 'post', url: string) =>
        request(app)[method](url).set('Authorization', auth.authHeader);
    const report = (auth: TestAdminAuth | TestAuth, body: ReportBody) => asWeb(auth, 'post', '/reports').send(body);
    const requestIds = (body: Array<{ id: string }>): string[] => body.map(row => row.id);
    const objectReportBody = (): ReportBody => ({
        parametrs: { object: true },
        indicators: {
            totalCountRequests: true,
            percentOfTotalCountRequest: true,
            budget: true,
            budgetPlan: true,
            percentOfBudgetPlan: true,
            closingSpeedOfRequests: false,
        },
        additionalParametrs: { isResult: true, reportType: 0, dynamicsTypes: [] },
        filterData: null,
    });
    const builderReportBody = (filterData: Record<string, string[]> | null = null): ReportBody => ({
        parametrs: { builder: true },
        indicators: {
            totalCountRequests: true,
            percentOfTotalCountRequest: false,
            budget: false,
            budgetPlan: false,
            percentOfBudgetPlan: false,
            closingSpeedOfRequests: false,
        },
        additionalParametrs: { isResult: false, reportType: 0, dynamicsTypes: [] },
        filterData,
    });

    beforeAll(async () => {
        process.env.MASTER_API_KEY = masterKey;
        admin = await createAdminAuth(logins.admin);
        manager = await createManagerAuth(logins.manager);
        emptyManager = await createManagerAuth(logins.emptyManager);
        observer = await createUserAuth(logins.observer, roles.OBSERVER, `Observer ${suffix}`);
        customer = await createUserAuth(logins.customer, roles.CUSTOMER, `Customer ${suffix}`);
        contractorUser = await createUserAuth(logins.contractor, roles.CONTRACTOR, `Contractor ${suffix}`);
        contractor = await createContractorFor(contractorUser.user);
        const { legal, unit } = await ensureBaseRefs();
        assignedObject = await ObjectDir.create({
            name: `Reports assigned ${suffix}`,
            unitId: unit.id,
            legalEntityId: legal.id,
            city: 'Москва',
            budgetPlan: 1000,
            number: 0,
        } as ObjectDir);
        secondAssignedUnit = await Unit.create({
            name: `Reports second assigned unit ${suffix}`,
            count: 0,
            number: 0,
        } as Unit);
        secondAssignedObject = await ObjectDir.create({
            name: `Reports second assigned ${suffix}`,
            unitId: secondAssignedUnit.id,
            legalEntityId: legal.id,
            city: 'Москва',
            budgetPlan: 2000,
            number: 0,
        } as ObjectDir);
        foreignObject = await ObjectDir.create({
            name: `Reports foreign ${suffix}`,
            unitId: unit.id,
            legalEntityId: legal.id,
            city: 'Москва',
            budgetPlan: 3000,
            number: 0,
        } as ObjectDir);
        await UserObject.bulkCreate([
            { userId: manager.user.id, objectId: assignedObject.id },
            { userId: manager.user.id, objectId: secondAssignedObject.id },
        ]);
        assignedRequest = await createRequest({
            objectId: assignedObject.id,
            contractorId: contractor.id,
            status: 1,
            urgency: 'Маршрут',
            builder: assignedBuilder,
            itineraryOrder: 1,
            repairPrice: 100,
            problemDescription: `assigned-report-${suffix}`,
        });
        secondAssignedRequest = await createRequest({
            objectId: secondAssignedObject.id,
            unitId: secondAssignedUnit.id,
            contractorId: contractor.id,
            status: 1,
            urgency: 'Маршрут',
            builder: assignedBuilder,
            itineraryOrder: 2,
            repairPrice: 200,
            problemDescription: `second-assigned-report-${suffix}`,
        });
        foreignRequest = await createRequest({
            objectId: foreignObject.id,
            contractorId: contractor.id,
            status: 2,
            urgency: 'Маршрут',
            builder: foreignBuilder,
            itineraryOrder: 3,
            repairPrice: 300,
            problemDescription: `foreign-report-${suffix}`,
        });
    });

    afterAll(async () => {
        await RepairRequest.destroy({
            where: { id: [assignedRequest.id, secondAssignedRequest.id, foreignRequest.id] },
            force: true,
        });
        await UserObject.destroy({ where: { userId: [manager.user.id, emptyManager.user.id] }, force: true });
        await Contractor.destroy({ where: { id: contractor.id }, force: true });
        await ObjectDir.destroy({
            where: { id: [assignedObject.id, secondAssignedObject.id, foreignObject.id] },
            force: true,
        });
        await Unit.destroy({ where: { id: secondAssignedUnit.id }, force: true });
        for (const login of Object.values(logins)) await cleanupByLogin(login);
        if (previousMasterKey === undefined) delete process.env.MASTER_API_KEY;
        else process.env.MASTER_API_KEY = previousMasterKey;
    });

    it('пересекает requests, itinerary и actual исполнителя со scope Менеджера', async () => {
        const [requestsResponse, itineraryResponse, firstActual, secondActual] = await Promise.all([
            asWeb(manager, 'get', `/contractors/${contractor.id}/requests`),
            asWeb(manager, 'get', `/contractors/${contractor.id}/itinerary`),
            asWeb(manager, 'get', `/contractors/${contractor.id}/${assignedObject.unitId}`),
            asWeb(manager, 'get', `/contractors/${contractor.id}/${secondAssignedUnit.id}`),
        ]);

        for (const response of [requestsResponse, itineraryResponse]) {
            expect(response.status).toBe(200);
            expect(requestIds(response.body)).toEqual(
                expect.arrayContaining([assignedRequest.id, secondAssignedRequest.id])
            );
            expect(requestIds(response.body)).not.toContain(foreignRequest.id);
        }
        expect(firstActual.status).toBe(200);
        expect(requestIds(firstActual.body)).toEqual([assignedRequest.id]);
        expect(secondActual.status).toBe(200);
        expect(requestIds(secondActual.body)).toEqual([secondAssignedRequest.id]);
    });

    it('scope-ит search branches contractor requests и itinerary', async () => {
        const assignedSearch = encodeURIComponent(`assigned-report-${suffix}`);
        const foreignSearch = encodeURIComponent(`foreign-report-${suffix}`);
        const [requestsAssigned, requestsForeign, itineraryAssigned, itineraryForeign] = await Promise.all([
            asWeb(manager, 'get', `/contractors/${contractor.id}/requests?search=${assignedSearch}`),
            asWeb(manager, 'get', `/contractors/${contractor.id}/requests?search=${foreignSearch}`),
            asWeb(manager, 'get', `/contractors/${contractor.id}/itinerary?search=${assignedSearch}`),
            asWeb(manager, 'get', `/contractors/${contractor.id}/itinerary?search=${foreignSearch}`),
        ]);

        for (const response of [requestsAssigned, itineraryAssigned]) {
            expect(response.status).toBe(200);
            expect(requestIds(response.body)).toContain(assignedRequest.id);
            expect(requestIds(response.body)).not.toContain(foreignRequest.id);
        }
        for (const response of [requestsForeign, itineraryForeign]) {
            expect(response.status).toBe(200);
            expect(response.body).toEqual([]);
        }
    });

    it('запрещает foreign explicit objectId и не расширяет пустой scope', async () => {
        const [foreign, emptyRequests, emptyItinerary, emptyActual] = await Promise.all([
            asWeb(manager, 'get', `/contractors/${contractor.id}/${foreignObject.unitId}/${foreignObject.id}`),
            asWeb(emptyManager, 'get', `/contractors/${contractor.id}/requests`),
            asWeb(emptyManager, 'get', `/contractors/${contractor.id}/itinerary`),
            asWeb(emptyManager, 'get', `/contractors/${contractor.id}/${assignedObject.unitId}`),
        ]);

        expect(foreign.status).toBe(403);
        expect(emptyRequests.body).toEqual([]);
        expect(emptyItinerary.body).toEqual([]);
        expect(emptyActual.body).toEqual([]);
    });

    it('оставляет contractor directory всем actor, но derived endpoints только admin-like/observer/bot', async () => {
        const [directory, customerDerived, anonymousDerived] = await Promise.all([
            asWeb(customer, 'get', '/contractors'),
            asWeb(customer, 'get', `/contractors/${contractor.id}/requests`),
            request(app).get(`/contractors/${contractor.id}/requests`),
        ]);

        expect(directory.status).toBe(200);
        expect(customerDerived.status).toBe(403);
        expect(anonymousDerived.status).toBe(401);
    });

    it('scope-ит report rows, filters, indicators, budgets и строку Итого', async () => {
        const response = await report(manager, objectReportBody());

        expect(response.status).toBe(200);
        expect(response.body.filterData.object.map((row: { objectId: string }) => row.objectId).sort()).toEqual(
            [assignedObject.id, secondAssignedObject.id].sort()
        );
        expect(response.body.filterData.object).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ objectId: assignedObject.id, object: assignedObject.name }),
                expect.objectContaining({
                    objectId: secondAssignedObject.id,
                    object: secondAssignedObject.name,
                }),
            ])
        );
        const assignedRow = response.body.resultRows.find(
            (row: { objectId?: string }) => row.objectId === assignedObject.id
        );
        const secondAssignedRow = response.body.resultRows.find(
            (row: { objectId?: string }) => row.objectId === secondAssignedObject.id
        );
        const totalRow = response.body.resultRows.find((row: { object?: string }) => row.object === 'Итого');
        expect(assignedRow).toMatchObject({
            totalCountRequests: 1,
            percentOfTotalCountRequest: 50,
            budget: 100,
            budgetPlan: 1000,
            percentOfBudgetPlan: 10,
        });
        expect(secondAssignedRow).toMatchObject({
            totalCountRequests: 1,
            percentOfTotalCountRequest: 50,
            budget: 200,
            budgetPlan: 2000,
            percentOfBudgetPlan: 10,
        });
        expect(totalRow).toMatchObject({
            totalCountRequests: 2,
            percentOfTotalCountRequest: 100,
            budget: 300,
            budgetPlan: 3000,
            percentOfBudgetPlan: 10,
        });
        expect(response.body.resultRows.some((row: { objectId?: string }) => row.objectId === foreignObject.id)).toBe(
            false
        );
    });

    it('не даёт spoofed filterData.builder вернуть builder чужого объекта', async () => {
        const [allBuilders, spoofed] = await Promise.all([
            report(manager, builderReportBody()),
            report(manager, builderReportBody({ builder: [foreignBuilder] })),
        ]);

        expect(allBuilders.status).toBe(200);
        expect(allBuilders.body.filterData.builder).toEqual([expect.objectContaining({ builder: assignedBuilder })]);
        expect(allBuilders.body.resultRows).toEqual([
            expect.objectContaining({ builder: assignedBuilder, totalCountRequests: 2 }),
        ]);
        expect(spoofed.status).toBe(200);
        expect(spoofed.body.resultRows).toEqual([]);
        expect(spoofed.body.filterData.builder).not.toContainEqual(
            expect.objectContaining({ builder: foreignBuilder })
        );
    });

    it('не даёт filterData.object вернуть строку чужого объекта', async () => {
        const body = objectReportBody();
        body.filterData = { object: [foreignObject.name] };

        const response = await report(manager, body);

        expect(response.status).toBe(200);
        expect(response.body.resultRows).toEqual([]);
        expect(response.body.filterData.object).not.toContainEqual(
            expect.objectContaining({ objectId: foreignObject.id })
        );
    });

    it('сохраняет тот же scope в recursive dynamics period', async () => {
        const now = new Date();
        const previousWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const previousRequests: RepairRequest[] = [];
        try {
            previousRequests.push(
                await createRequest({
                    objectId: assignedObject.id,
                    contractorId: contractor.id,
                    status: 3,
                    urgency: 'Маршрут',
                    builder: assignedBuilder,
                    repairPrice: 100,
                    createdAt: previousWeek,
                })
            );
            previousRequests.push(
                await createRequest({
                    objectId: foreignObject.id,
                    contractorId: contractor.id,
                    status: 3,
                    urgency: 'Маршрут',
                    builder: assignedBuilder,
                    repairPrice: 300,
                    createdAt: previousWeek,
                })
            );
            previousRequests.push(
                await createRequest({
                    objectId: foreignObject.id,
                    contractorId: contractor.id,
                    status: 3,
                    urgency: 'Маршрут',
                    builder: assignedBuilder,
                    repairPrice: 300,
                    createdAt: previousWeek,
                })
            );
            const body: ReportBody = {
                parametrs: { builder: true },
                indicators: {
                    totalCountRequests: true,
                    percentOfTotalCountRequest: false,
                    budget: false,
                    budgetPlan: false,
                    percentOfBudgetPlan: false,
                    closingSpeedOfRequests: false,
                },
                additionalParametrs: {
                    isResult: false,
                    reportType: 0,
                    dynamicsTypes: ['week'],
                    dateStart: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
                    dateEnd: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
                },
                filterData: { builder: [assignedBuilder] },
            };

            const response = await report(manager, body);

            expect(response.status).toBe(200);
            expect(response.body.resultRows).toEqual([
                expect.objectContaining({
                    builder: assignedBuilder,
                    totalCountRequests: 2,
                    totalCountRequestsWeekDynamics: 100,
                }),
            ]);
        } finally {
            await RepairRequest.destroy({ where: { id: previousRequests.map(item => item.id) }, force: true });
        }
    });

    it('считает closingSpeed только по закрытым заявкам назначенных объектов', async () => {
        const closingBuilder = `Closing builder ${suffix}`;
        const temporaryRequests: RepairRequest[] = [];
        try {
            temporaryRequests.push(
                await createRequest({
                    objectId: assignedObject.id,
                    contractorId: contractor.id,
                    status: 3,
                    builder: closingBuilder,
                    daysAtWork: 2,
                })
            );
            temporaryRequests.push(
                await createRequest({
                    objectId: secondAssignedObject.id,
                    unitId: secondAssignedUnit.id,
                    contractorId: contractor.id,
                    status: 3,
                    builder: closingBuilder,
                    daysAtWork: 4,
                })
            );
            temporaryRequests.push(
                await createRequest({
                    objectId: foreignObject.id,
                    contractorId: contractor.id,
                    status: 3,
                    builder: closingBuilder,
                    daysAtWork: 20,
                })
            );
            temporaryRequests.push(
                await createRequest({
                    objectId: foreignObject.id,
                    contractorId: contractor.id,
                    status: 3,
                    builder: closingBuilder,
                    daysAtWork: 30,
                })
            );
            const body: ReportBody = {
                parametrs: { builder: true },
                indicators: {
                    totalCountRequests: false,
                    percentOfTotalCountRequest: false,
                    budget: false,
                    budgetPlan: false,
                    percentOfBudgetPlan: false,
                    closingSpeedOfRequests: true,
                },
                additionalParametrs: { isResult: false, reportType: 0, dynamicsTypes: [] },
                filterData: { builder: [closingBuilder] },
            };

            const response = await report(manager, body);

            expect(response.status).toBe(200);
            expect(response.body.resultRows).toEqual([
                expect.objectContaining({
                    builder: closingBuilder,
                    totalDaysAtWork: 6,
                    totalRequestsCount: 2,
                    closingSpeedOfRequests: 3,
                }),
            ]);
        } finally {
            await RepairRequest.destroy({ where: { id: temporaryRequests.map(item => item.id) }, force: true });
        }
    });

    it('возвращает Менеджеру без объектов пустые report rows и zero/empty filter data', async () => {
        const response = await report(emptyManager, objectReportBody());

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ resultRows: [], filterData: { object: [] } });
    });

    it('Администратор, Наблюдатель и bot видят все заявки в reports и contractor-derived data', async () => {
        const [
            adminContractor,
            botContractor,
            adminItinerary,
            botItinerary,
            adminFirstActual,
            botFirstActual,
            adminSecondActual,
            botSecondActual,
            adminReport,
            observerReport,
            botReport,
        ] = await Promise.all([
            asWeb(admin, 'get', `/contractors/${contractor.id}/requests`),
            request(app).get(`/contractors/${contractor.id}/requests`).set('master-api-key', masterKey),
            asWeb(admin, 'get', `/contractors/${contractor.id}/itinerary`),
            request(app).get(`/contractors/${contractor.id}/itinerary`).set('master-api-key', masterKey),
            asWeb(admin, 'get', `/contractors/${contractor.id}/${assignedObject.unitId}`),
            request(app).get(`/contractors/${contractor.id}/${assignedObject.unitId}`).set('master-api-key', masterKey),
            asWeb(admin, 'get', `/contractors/${contractor.id}/${secondAssignedUnit.id}`),
            request(app).get(`/contractors/${contractor.id}/${secondAssignedUnit.id}`).set('master-api-key', masterKey),
            report(admin, builderReportBody()),
            report(observer, builderReportBody()),
            request(app).post('/reports').set('master-api-key', masterKey).send(builderReportBody()),
        ]);

        for (const response of [adminContractor, botContractor, adminItinerary, botItinerary]) {
            expect(response.status).toBe(200);
            expect(requestIds(response.body)).toEqual(
                expect.arrayContaining([assignedRequest.id, secondAssignedRequest.id, foreignRequest.id])
            );
        }
        for (const response of [adminFirstActual, botFirstActual]) {
            expect(response.status).toBe(200);
            expect(requestIds(response.body)).toEqual(expect.arrayContaining([assignedRequest.id, foreignRequest.id]));
            expect(requestIds(response.body)).toHaveLength(2);
        }
        for (const response of [adminSecondActual, botSecondActual]) {
            expect(response.status).toBe(200);
            expect(requestIds(response.body)).toEqual([secondAssignedRequest.id]);
        }
        for (const response of [adminReport, observerReport, botReport]) {
            expect(response.status).toBe(200);
            expect(response.body.resultRows).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ builder: assignedBuilder, totalCountRequests: 2 }),
                    expect.objectContaining({ builder: foreignBuilder, totalCountRequests: 1 }),
                ])
            );
        }
    });

    it('защищает reports ролью и actor authentication', async () => {
        const [customerResponse, anonymousResponse] = await Promise.all([
            report(customer, builderReportBody()),
            request(app).post('/reports').send(builderReportBody()),
        ]);

        expect(customerResponse.status).toBe(403);
        expect(anonymousResponse.status).toBe(401);
    });
});
