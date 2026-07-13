import statuses from './statuses';
import roles from './roles';

export const requestStatusUiLabel: Record<number, string> = {
    [statuses.NEW_REQUEST]: 'Новая',
    [statuses.AT_WORK]: 'В работе',
    [statuses.DONE]: 'Выполнена',
    [statuses.IRRELEVANT]: 'Неактуальна',
    [statuses.FALSE]: 'Выезд без выполнения',
};

export const roleUiLabel: Record<number, string> = {
    [roles.ADMIN]: 'Администратор',
    [roles.CUSTOMER]: 'Заказчик',
    [roles.CONTRACTOR]: 'Исполнитель',
    [roles.OBSERVER]: 'Наблюдатель',
    [roles.MANAGER]: 'Менеджер',
};

export const formatRequestRef = (number: number | null | undefined): string => {
    if (number === null || number === undefined || Number.isNaN(Number(number))) {
        return 'Заявка';
    }
    return `Заявка № ${number}`;
};

export const getStatusUiLabel = (statusNumber: number): string =>
    requestStatusUiLabel[statusNumber] ?? `Статус ${statusNumber}`;

export const getRoleUiLabel = (roleNumber: number): string => roleUiLabel[roleNumber] ?? 'Пользователь';

export const PUSH_TITLE_LIMIT = 50;
export const PUSH_BODY_LIMIT = 200;

const trimToLimit = (text: string, limit: number): string => {
    if (text.length <= limit) return text;
    return `${text.slice(0, Math.max(0, limit - 1))}…`;
};

type NotificationContent = { title: string; body: string };

export const notificationContent = {
    statusChanged: (requestNumber: number | null | undefined, statusNumber: number): NotificationContent => ({
        title: trimToLimit(formatRequestRef(requestNumber), PUSH_TITLE_LIMIT),
        body: trimToLimit(`Статус: «${getStatusUiLabel(statusNumber)}»`, PUSH_BODY_LIMIT),
    }),
    urgencyChanged: (requestNumber: number | null | undefined, urgencyName: string): NotificationContent => ({
        title: trimToLimit(formatRequestRef(requestNumber), PUSH_TITLE_LIMIT),
        body: trimToLimit(`Срочность: «${urgencyName}»`, PUSH_BODY_LIMIT),
    }),
    commentChanged: (requestNumber: number | null | undefined): NotificationContent => ({
        title: trimToLimit(formatRequestRef(requestNumber), PUSH_TITLE_LIMIT),
        body: 'Новое сообщение в чате заявки',
    }),
    requestAssigned: (requestNumber: number | null | undefined): NotificationContent => ({
        title: trimToLimit(formatRequestRef(requestNumber), PUSH_TITLE_LIMIT),
        body: 'Заявка назначена вам в работу',
    }),
    requestCreated: (requestNumber: number | null | undefined): NotificationContent => ({
        title: 'Новая заявка',
        body: trimToLimit(`Создана ${formatRequestRef(requestNumber).toLowerCase()}`, PUSH_BODY_LIMIT),
    }),
    registrationRequest: (roleNumber?: number): NotificationContent => ({
        title: 'Заявка на регистрацию',
        body:
            roleNumber === undefined
                ? 'Поступила новая заявка на регистрацию'
                : trimToLimit(`Поступила новая заявка на регистрацию — ${getRoleUiLabel(roleNumber)}`, PUSH_BODY_LIMIT),
    }),
    registrationApproved: (): NotificationContent => ({
        title: 'Регистрация подтверждена',
        body: 'Учётная запись активирована — можно войти в личный кабинет',
    }),
};

export default {
    requestStatusUiLabel,
    roleUiLabel,
    formatRequestRef,
    getStatusUiLabel,
    getRoleUiLabel,
    notificationContent,
    PUSH_TITLE_LIMIT,
    PUSH_BODY_LIMIT,
};
