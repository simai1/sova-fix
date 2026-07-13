import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import roles from '../../src/config/roles';
import wsEvents from '../../src/config/wsEvents';
import Contractor from '../../src/models/contractor';
import ObjectDir from '../../src/models/object';
import RepairRequest from '../../src/models/repairRequest';
import User from '../../src/models/user';
import UserObject from '../../src/models/userObject';
import authService from '../../src/services/auth.service';
import lkService from '../../src/services/lk.service';
import notificationService from '../../src/services/notification.service';
import pushNotificationService from '../../src/services/pushNotification.service';
import { getAdministrativeAudienceUserIds } from '../../src/services/request-access.service';
import requestService from '../../src/services/request.service';
import * as ws from '../../src/utils/ws';
import { createUserAuth, cleanupByLogin, createObjectFor, createRequest, ensureBaseRefs } from '../helpers/lk-helper';

const unique = (ids: string[]): string[] => Array.from(new Set(ids));

describe('Manager request and registration audiences', () => {
    const logins = {
        admin: 'manager-notify-admin@t.local',
        inactiveAdmin: 'manager-notify-inactive-admin@t.local',
        assignedManager: 'manager-notify-assigned@t.local',
        foreignManager: 'manager-notify-foreign@t.local',
        inactiveManager: 'manager-notify-inactive@t.local',
        contractor: 'manager-notify-contractor@t.local',
        pending: 'manager-notify-pending@t.local',
    };
    let admin: User;
    let inactiveAdmin: User;
    let assignedManager: User;
    let foreignManager: User;
    let inactiveManager: User;
    let contractorUser: User;
    let contractor: Contractor;
    let assignedObject: ObjectDir;
    let foreignObject: ObjectDir;
    let repairRequest: RepairRequest;
    let urgencyId: string;
    const createdRequestIds: string[] = [];
    const sendSpy = vi.spyOn(pushNotificationService, 'sendToUsers');
    const emitSpy = vi.spyOn(ws, 'emitTo');

    beforeAll(async () => {
        const refs = await ensureBaseRefs();
        urgencyId = refs.urgency.id;
        for (const login of Object.values(logins)) await cleanupByLogin(login);

        admin = (await createUserAuth(logins.admin, roles.ADMIN, 'Notify Admin')).user;
        inactiveAdmin = (await createUserAuth(logins.inactiveAdmin, roles.ADMIN, 'Notify Inactive Admin')).user;
        assignedManager = (await createUserAuth(logins.assignedManager, roles.MANAGER, 'Notify Manager A')).user;
        foreignManager = (await createUserAuth(logins.foreignManager, roles.MANAGER, 'Notify Manager B')).user;
        inactiveManager = (await createUserAuth(logins.inactiveManager, roles.MANAGER, 'Notify Inactive Manager')).user;
        contractorUser = (await createUserAuth(logins.contractor, roles.CONTRACTOR, 'Notify Contractor')).user;
        await inactiveAdmin.update({ isActivated: false });
        await inactiveManager.update({ isActivated: false });

        assignedObject = await createObjectFor(assignedManager, 'NotifyAssigned');
        foreignObject = await createObjectFor(foreignManager, 'NotifyForeign');
        await UserObject.create({ userId: inactiveManager.id, objectId: assignedObject.id });
        contractor = await Contractor.create({ userId: contractorUser.id });
        repairRequest = await createRequest({
            objectId: assignedObject.id,
            contractorId: contractor.id,
            createdByUserId: foreignManager.id,
        });
    });

    afterAll(async () => {
        await RepairRequest.destroy({ where: { id: [repairRequest.id, ...createdRequestIds] }, force: true });
        await Contractor.destroy({ where: { id: contractor.id }, force: true });
        await ObjectDir.destroy({ where: { id: [assignedObject.id, foreignObject.id] }, force: true });
        for (const login of Object.values(logins)) await cleanupByLogin(login);
        sendSpy.mockRestore();
        emitSpy.mockRestore();
    });

    beforeEach(() => {
        sendSpy.mockReset();
        sendSpy.mockResolvedValue(undefined);
        emitSpy.mockClear();
    });

    it('REQUEST_CREATE Push получает active Admin и только active Manager объекта', async () => {
        const expected = await getAdministrativeAudienceUserIds(assignedObject.id);

        await notificationService.notifyRequestCreated(repairRequest);

        expect(sendSpy).toHaveBeenCalledTimes(1);
        const audience = sendSpy.mock.calls[0][0];
        expect(audience).toEqual(expected);
        expect(audience).toEqual(expect.arrayContaining([admin.id, assignedManager.id]));
        expect(audience).not.toEqual(expect.arrayContaining([foreignManager.id, inactiveManager.id, inactiveAdmin.id]));
        expect(new Set(audience).size).toBe(audience.length);
    });

    it('REQUEST_ASSIGNED WS/Push использует один deduped union assignee и object administrative audience', async () => {
        const administrativeAudience = await getAdministrativeAudienceUserIds(assignedObject.id);
        const expected = unique([...administrativeAudience, contractorUser.id]);

        await requestService.setContractor(repairRequest.id, contractor.id, undefined, repairRequest);

        const assignedEmits = emitSpy.mock.calls.filter(([, event]) => event === wsEvents.REQUEST_ASSIGNED);
        expect(assignedEmits).toHaveLength(1);
        expect(assignedEmits[0][0]).toEqual({ kind: 'users', userIds: expected });
        const assignedPush = sendSpy.mock.calls.find(
            ([, payload]) => payload.tag === `request-${repairRequest.id}-assigned`
        );
        expect(assignedPush?.[0]).toEqual(expected);
        expect(expected).not.toEqual(expect.arrayContaining([foreignManager.id, inactiveManager.id, inactiveAdmin.id]));
    });

    it('LK REQUEST_CREATE WS отправляется один раз объектной users-аудитории', async () => {
        const expected = await getAdministrativeAudienceUserIds(assignedObject.id);

        const created = await lkService.createForCustomer(
            assignedManager.id,
            {
                objectId: assignedObject.id,
                problemDescription: 'Audience test',
                urgencyId,
            },
            [],
            roles.MANAGER
        );
        createdRequestIds.push(created.id);

        const createdEmits = emitSpy.mock.calls.filter(([, event]) => event === 'REQUEST_CREATE');
        expect(createdEmits).toHaveLength(1);
        expect(createdEmits[0][0]).toEqual({ kind: 'users', userIds: expected });
    });

    it('registration WS/Push получает всех active Admin/Manager globally без дублей', async () => {
        const expected = await getAdministrativeAudienceUserIds();

        const result = await authService.registerPublic(
            logins.pending,
            'Valid-password-123',
            'Pending',
            roles.CUSTOMER
        );

        const registrationEmits = emitSpy.mock.calls.filter(
            ([, event]) => event === wsEvents.USER_REGISTRATION_REQUEST
        );
        expect(registrationEmits).toHaveLength(1);
        expect(registrationEmits[0][0]).toEqual({ kind: 'users', userIds: expected });
        expect(sendSpy).toHaveBeenCalledTimes(1);
        expect(sendSpy.mock.calls[0][0]).toEqual(expected);
        expect(expected).toEqual(expect.arrayContaining([admin.id, assignedManager.id, foreignManager.id]));
        expect(expected).not.toEqual(expect.arrayContaining([inactiveAdmin.id, inactiveManager.id]));
        expect(new Set(expected).size).toBe(expected.length);

        await User.destroy({ where: { id: result.user.id }, force: true });
    });
});
