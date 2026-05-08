// Единый источник правды для текстов уведомлений (push + TG).
// Принципиально: лексика и формат — те же, что в UI ЛК
// (front/src/components/Lk/StatusChip.tsx, RequestCard.tsx, LkListItem.tsx).
// На бэкенде есть параллельный statusesRuLocale (нижний регистр, «новая заявка»)
// — он остаётся для логов/поиска/legacy, для пользовательских текстов используем
// этот словарь, чтобы юзер видел одни и те же слова и в карточке, и в нотификации.

import statuses from './statuses';
import roles from './roles';

// Title-Case ровно как в front/src/components/Lk/StatusChip.tsx::STATUS_LABELS.
export const requestStatusUiLabel: Record<number, string> = {
    [statuses.NEW_REQUEST]: 'Новая',
    [statuses.AT_WORK]: 'В работе',
    [statuses.DONE]: 'Выполнена',
    [statuses.IRRELEVANT]: 'Неактуальна',
    [statuses.FALSE]: 'Выезд без выполнения',
};

// Названия ролей — без бэкенд-литералов CONTRACTOR/CUSTOMER, как видит их юзер.
export const roleUiLabel: Record<number, string> = {
    [roles.USER]: 'Пользователь',
    [roles.ADMIN]: 'Менеджер',
    [roles.CUSTOMER]: 'Заказчик',
    [roles.CONTRACTOR]: 'Исполнитель',
    [roles.OBSERVER]: 'Наблюдатель',
};

// Формат ссылки на заявку — как в RequestCard.tsx::186 «Заявка № {request.number}».
// Пробел после № обязателен (ГОСТ, и совпадает с UI). Не используем `#`.
export const formatRequestRef = (number: number | null | undefined): string => {
    if (number === null || number === undefined || Number.isNaN(Number(number))) {
        return 'Заявка';
    }
    return `Заявка № ${number}`;
};

export const getStatusUiLabel = (statusNumber: number): string =>
    requestStatusUiLabel[statusNumber] ?? `Статус ${statusNumber}`;

export const getRoleUiLabel = (roleNumber: number): string => roleUiLabel[roleNumber] ?? 'Пользователь';

// Push-payload ограничен (см. pushNotification.service.ts §11): title ≤ 50, body ≤ 200.
// Эти же тексты идут и в TG, поэтому дополнительно следим, чтобы они были полные
// предложения и не теряли смысл при обрезке. Лимит для body чата (комментария) —
// 197 + многоточие, лимит для остального — обычно вписываемся.
export const PUSH_TITLE_LIMIT = 50;
export const PUSH_BODY_LIMIT = 200;

const trimToLimit = (text: string, limit: number): string => {
    if (text.length <= limit) return text;
    return `${text.slice(0, Math.max(0, limit - 1))}…`;
};

type NotificationContent = { title: string; body: string };

// Каждый builder возвращает {title, body}, выровненные по UI-словарю.
// Не кладём PII (имена/email/телефоны/адреса) — push-сервис вендора видит
// зашифрованный пакет, но устройство юзера расшифровывает, и для регистрации
// детали юзер увидит только в ЛК, открыв карточку.
export const notificationContent = {
    statusChanged: (requestNumber: number | null | undefined, statusNumber: number): NotificationContent => ({
        title: trimToLimit(formatRequestRef(requestNumber), PUSH_TITLE_LIMIT),
        body: trimToLimit(`Статус: «${getStatusUiLabel(statusNumber)}»`, PUSH_BODY_LIMIT),
    }),
    urgencyChanged: (requestNumber: number | null | undefined, urgencyName: string): NotificationContent => ({
        title: trimToLimit(formatRequestRef(requestNumber), PUSH_TITLE_LIMIT),
        body: trimToLimit(`Срочность: «${urgencyName}»`, PUSH_BODY_LIMIT),
    }),
    // Намеренно не кладём текст комментария в body: пользовательский ввод
    // в заявках регулярно содержит ФИО, телефоны, адреса объектов. Push-payload
    // оседает в системном трее/lock-screen'е и в push history устройства,
    // и видно его любому приложению с Notification Listener Service permission.
    // (см. spec §7 P-3 «PII в payload»). Текст юзер увидит, нажав на нотификацию
    // и открыв чат.
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
