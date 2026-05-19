import RepairRequest from '../models/repairRequest';
import Contractor from '../models/contractor';
import User from '../models/user';
import roles from '../config/roles';
import { notificationContent } from '../config/notificationLabels';
import pushNotificationService, { PushPayload } from './pushNotification.service';
import logger from '../utils/logger';

type Role = 'CONTRACTOR' | 'CUSTOMER' | 'ADMIN' | 'OBSERVER';

const getCustomerUserId = (request: RepairRequest): string | null => request.createdByUserId ?? null;

const getContractorUserId = async (request: RepairRequest): Promise<string | null> => {
    if (!request.contractorId) return null;
    const contractor = await Contractor.findByPk(request.contractorId);
    return contractor?.userId ?? null;
};

const getManagerUserIds = async (): Promise<string[]> => {
    try {
        const managers = await User.findAll({
            where: { role: roles.ADMIN, isActivated: true },
            attributes: ['id'],
        });
        return managers.map(m => m.id);
    } catch (err) {
        logger.log({
            level: 'error',
            message: `notification.getManagerUserIds failed: ${(err as Error).message}`,
        });
        return [];
    }
};

const safeSend = async (userIds: string[], payload: PushPayload, eventName: string): Promise<void> => {
    if (userIds.length === 0) return;
    const unique = Array.from(new Set(userIds.filter((id): id is string => !!id)));
    if (unique.length === 0) return;
    try {
        await pushNotificationService.sendToUsers(unique, payload);
    } catch (err) {
        logger.log({
            level: 'error',
            message: `notification[${eventName}] sendToUsers failed: ${(err as Error).message}`,
        });
    }
};

const buildRequestUrl = (requestId: string, audience: 'customer' | 'contractor'): string =>
    `/lk/${audience}/requests/${requestId}`;

const notifyStatusChanged = async (
    request: RepairRequest,
    newStatus: number,
    options: { excludeUserId?: string | null } = {}
): Promise<void> => {
    const audienceRaw = [getCustomerUserId(request), await getContractorUserId(request)];
    const audience = audienceRaw.filter((id): id is string => !!id && id !== options.excludeUserId);
    if (audience.length === 0) return;

    const { title, body } = notificationContent.statusChanged(request.number, newStatus);
    await safeSend(
        audience,
        {
            title,
            body,
            url: buildRequestUrl(request.id, 'customer'),
            tag: `request-${request.id}-status`,
            requestId: request.id,
        },
        'STATUS_UPDATE'
    );
};

const notifyUrgencyChanged = async (
    request: RepairRequest,
    newUrgency: string,
    options: { excludeUserId?: string | null } = {}
): Promise<void> => {
    const audienceRaw = [getCustomerUserId(request), await getContractorUserId(request)];
    const audience = audienceRaw.filter((id): id is string => !!id && id !== options.excludeUserId);
    if (audience.length === 0) return;

    const { title, body } = notificationContent.urgencyChanged(request.number, newUrgency);
    await safeSend(
        audience,
        {
            title,
            body,
            url: buildRequestUrl(request.id, 'customer'),
            tag: `request-${request.id}-urgency`,
            requestId: request.id,
        },
        'URGENCY_UPDATE'
    );
};

const notifyCommentChanged = async (
    request: RepairRequest,
    authorRole: Role,
    authorUserId: string | null
): Promise<void> => {
    const customerId = getCustomerUserId(request);
    const contractorId = await getContractorUserId(request);

    let targetUserId: string | null = null;
    let audience: 'customer' | 'contractor' = 'customer';

    if (authorRole === 'CONTRACTOR' || authorRole === 'ADMIN') {
        if (customerId && customerId !== authorUserId) {
            targetUserId = customerId;
            audience = 'customer';
        }
    } else {
        if (contractorId && contractorId !== authorUserId) {
            targetUserId = contractorId;
            audience = 'contractor';
        }
    }

    if (!targetUserId) return;

    const { title, body } = notificationContent.commentChanged(request.number);
    await safeSend(
        [targetUserId],
        {
            title,
            body,
            url: buildRequestUrl(request.id, audience),
            tag: `request-${request.id}-comments`,
            requestId: request.id,
        },
        'COMMENT_CREATE'
    );
};

const notifyRequestAssigned = async (request: RepairRequest): Promise<void> => {
    const contractorUserId = await getContractorUserId(request);
    if (!contractorUserId) return;

    const { title, body } = notificationContent.requestAssigned(request.number);
    await safeSend(
        [contractorUserId],
        {
            title,
            body,
            url: buildRequestUrl(request.id, 'contractor'),
            tag: `request-${request.id}-assigned`,
            requestId: request.id,
        },
        'REQUEST_ASSIGNED'
    );
};

const notifyRequestCreated = async (request: RepairRequest): Promise<void> => {
    const managerIds = await getManagerUserIds();
    if (managerIds.length === 0) return;

    const { title, body } = notificationContent.requestCreated(request.number);
    await safeSend(
        managerIds,
        {
            title,
            body,
            url: '/AdminPages/HomePageAdmin',
            tag: `request-created-${request.id}`,
            requestId: request.id,
        },
        'REQUEST_CREATE'
    );
};

const notifyRegistrationRequest = async (roleNumber?: number): Promise<void> => {
    const managerIds = await getManagerUserIds();
    if (managerIds.length === 0) return;

    const { title, body } = notificationContent.registrationRequest(roleNumber);
    await safeSend(
        managerIds,
        {
            title,
            body,
            url: '/Directory/RegistrationRequests',
            tag: 'registration-request',
        },
        'USER_REGISTRATION_REQUEST'
    );
};

const notifyRegistrationApproved = async (userId: string): Promise<void> => {
    const { title, body } = notificationContent.registrationApproved();
    await safeSend(
        [userId],
        {
            title,
            body,
            url: '/lk/',
            tag: `user-${userId}-approved`,
        },
        'USER_CONFIRM'
    );
};

export default {
    notifyStatusChanged,
    notifyUrgencyChanged,
    notifyCommentChanged,
    notifyRequestAssigned,
    notifyRequestCreated,
    notifyRegistrationRequest,
    notifyRegistrationApproved,
};
