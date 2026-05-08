// Бизнес-слой уведомлений: маппит доменные события заявок и регистраций
// на push-сообщения с UI-текстами и правильной аудиторией.
//
// Архитектура:
//   service-layer (request.service / lk.service / auth.service / user.service)
//     → notification.service  (этот файл: «что» + «кому»)
//       → pushNotification.service  («как» — web-push protocol)
//
// Все методы fire-and-forget: ошибки логируются, но не пробрасываются дальше
// (push best-effort, см. pushNotification.service.ts §13). Это критично для
// зеркалирования с TG: WS broadcast уже произошёл, провал push не должен
// откатить бизнес-операцию (запись в БД уже сделана).

import RepairRequest from '../models/repairRequest';
import Contractor from '../models/contractor';
import User from '../models/user';
import roles from '../config/roles';
import { notificationContent } from '../config/notificationLabels';
import pushNotificationService, { PushPayload } from './pushNotification.service';
import logger from '../utils/logger';

type Role = 'CONTRACTOR' | 'CUSTOMER' | 'ADMIN' | 'OBSERVER';

// Возвращает userId создателя заявки (web-flow). Заявки из TG-flow имеют
// createdByUserId=null (они привязаны к TgUser.createdBy) — push для них
// корректно не отправляется, и это OK: после удаления бота останется только
// web-flow с заполненным createdByUserId.
const getCustomerUserId = (request: RepairRequest): string | null => request.createdByUserId ?? null;

// Возвращает userId юзера-исполнителя для inhouse-подрядчика.
// ExtContractor / менеджер-исполнитель / «Внешний подрядчик» юзера в системе
// не имеют — для них push-исполнителя не отправляем (и не должны).
const getContractorUserId = async (request: RepairRequest): Promise<string | null> => {
    if (!request.contractorId) return null;
    const contractor = await Contractor.findByPk(request.contractorId);
    return contractor?.userId ?? null;
};

const getManagerUserIds = async (): Promise<string[]> => {
    const managers = await User.findAll({
        where: { role: roles.ADMIN, pendingApproval: false },
        attributes: ['id'],
    });
    return managers.map(m => m.id);
};

// Заворачиваем в try/catch отдельно от sendToUsers (там уже есть
// Promise.allSettled), чтобы любая ошибка достачи аудитории не уронила
// бизнес-операцию. Пишем в лог и идём дальше.
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

// Смена статуса заявки (любой источник: подрядчик, менеджер, bulk).
// Аудитория: создатель + назначенный inhouse-исполнитель (если есть).
// Источник изменения исключаем через `excludeUserId` — чтобы юзер,
// который сам поменял статус, не получил пуш на собственное действие.
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

// Новый комментарий — пушим только противоположной стороне диалога.
// authorRole определяет, в какую часть ЛК направит ссылка получателя:
// автор-CUSTOMER → получатель-CONTRACTOR увидит ссылку на /lk/contractor/...
// authorUserId — null означает «admin-flow, никого не исключаем»; проверка
// !== authorUserId безопасна и для null, и для UUID.
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
        // Сторона исполнителя/менеджера написала — пушим заказчика.
        if (customerId && customerId !== authorUserId) {
            targetUserId = customerId;
            audience = 'customer';
        }
    } else {
        // CUSTOMER написал — пушим назначенного исполнителя.
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

// Заявка назначена inhouse-исполнителю — пушим самого исполнителя.
// CUSTOMER уже получит push о смене статуса (NEW_REQUEST → AT_WORK)
// через notifyStatusChanged, поэтому здесь только исполнитель.
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

// Создание новой заявки — пушим всех менеджеров (роль ADMIN).
// Реализация TG-flow слала всем менеджерам, и мы зеркалируем её один-в-один.
const notifyRequestCreated = async (request: RepairRequest): Promise<void> => {
    const managerIds = await getManagerUserIds();
    if (managerIds.length === 0) return;

    const { title, body } = notificationContent.requestCreated(request.number);
    await safeSend(
        managerIds,
        {
            title,
            body,
            // Менеджеры идут в общий список заявок (admin-главная), не в ЛК заказчика.
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
            // Страница менеджера со списком ожидающих регистраций.
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
