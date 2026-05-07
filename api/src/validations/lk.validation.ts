import Joi from 'joi';

const ru = (label: string) => ({
    'string.empty': `Поле ${label} не может быть пустым`,
    'string.base': `Поле ${label} должно быть строкой`,
    'string.guid': `Поле ${label} должно быть UUID`,
    'string.max': `Поле ${label} превышает допустимую длину`,
    'string.min': `Поле ${label} слишком короткое`,
    'any.required': `Поле ${label} обязательно`,
    'number.base': `Поле ${label} должно быть числом`,
    'number.integer': `Поле ${label} должно быть целым числом`,
    'number.min': `Поле ${label} меньше допустимого минимума`,
    'number.max': `Поле ${label} больше допустимого максимума`,
    'date.base': `Поле ${label} должно быть датой`,
    'any.only': `Поле ${label} имеет недопустимое значение`,
});

export const listQuerySchema = Joi.object({
    body: Joi.object().unknown(true),
    params: Joi.object().unknown(true),
    query: Joi.object({
        role: Joi.string().valid('contractor', 'customer', 'CONTRACTOR', 'CUSTOMER').required().messages(ru('role')),
        page: Joi.number().integer().min(1).optional().messages(ru('page')),
        limit: Joi.number().integer().min(1).max(100).optional().messages(ru('limit')),
        search: Joi.string().allow('').optional().messages(ru('search')),
        objectId: Joi.string().uuid().optional().messages(ru('objectId')),
        unitId: Joi.string().uuid().optional().messages(ru('unitId')),
        legalEntityId: Joi.string().uuid().optional().messages(ru('legalEntityId')),
        statusId: Joi.string().uuid().optional().messages(ru('statusId')),
        urgencyId: Joi.string().uuid().optional().messages(ru('urgencyId')),
        dateFrom: Joi.date().optional().messages(ru('dateFrom')),
        dateTo: Joi.date().optional().messages(ru('dateTo')),
        // Алиасы 'urgency'/'date'/'status' — sort-ключи для фронта. 'urgencyId' убран
        // (audit M1): сортировать по UUID бессмысленно, фронт использует 'urgency'.
        sort: Joi.string().valid('createdAt', 'status', 'urgency', 'date').optional().messages(ru('sort')),
        order: Joi.string().valid('asc', 'desc', 'ASC', 'DESC').optional().messages(ru('order')),
    }).unknown(false),
});

export const createRequestSchema = Joi.object({
    body: Joi.object({
        objectId: Joi.string().uuid().required().messages(ru('objectId')),
        problemDescription: Joi.string().min(1).max(1000).required().messages(ru('problemDescription')),
        urgencyId: Joi.string().uuid().required().messages(ru('urgencyId')),
    }).unknown(false),
    params: Joi.object().unknown(true),
    query: Joi.object().unknown(true),
});

export const statusSchema = Joi.object({
    body: Joi.object({
        statusNumber: Joi.number().integer().min(1).max(5).required().messages(ru('statusNumber')),
    }).unknown(false),
    params: Joi.object({
        id: Joi.string().uuid().required().messages(ru('id')),
    }),
    query: Joi.object().unknown(true),
});

// Текст чат-сообщения: лимит 4000 — UI допускает многострочный ввод.
// Старый лимит 2000 был связан с overwrite-only legacy `RepairRequest.comment`;
// новая семантика append'а (RequestComment) позволяет более ёмкие сообщения.
export const addCommentSchema = Joi.object({
    body: Joi.object({
        text: Joi.string().min(1).max(4000).required().messages(ru('text')),
    }).unknown(false),
    params: Joi.object({
        id: Joi.string().uuid().required().messages(ru('id')),
    }),
    query: Joi.object().unknown(true),
});

// Cursor-пагинация для GET /lk/requests/:id/comments.
// Cursor — строка вида "<ISO-timestamp>:<UUID>" (без base64; для отладки удобнее
// человекочитаемая форма; XSS неактуален — мы её только парсим).
export const commentListQuerySchema = Joi.object({
    body: Joi.object().unknown(true),
    params: Joi.object({
        id: Joi.string().uuid().required().messages(ru('id')),
    }),
    query: Joi.object({
        cursor: Joi.string().optional().messages(ru('cursor')),
        limit: Joi.number().integer().min(1).max(50).optional().messages(ru('limit')),
        order: Joi.string().valid('asc', 'ASC').optional().messages(ru('order')),
    }).unknown(false),
});

export const requestIdParamSchema = Joi.object({
    body: Joi.object().unknown(true),
    params: Joi.object({
        id: Joi.string().uuid().required().messages(ru('id')),
    }),
    query: Joi.object().unknown(true),
});

// Web Push: subscribe-эндпоинт. endpoint обязан быть https и из allowlist'а
// push-сервисов вендоров (доп. защита от SSRF — основная в сервисе через
// `isAllowedPushHost`, здесь — поверхностная проверка длины/формата).
export const pushSubscribeSchema = Joi.object({
    body: Joi.object({
        endpoint: Joi.string()
            .uri({ scheme: ['https'] })
            .min(50)
            .max(2048)
            .required()
            .messages(ru('endpoint')),
        keys: Joi.object({
            p256dh: Joi.string().min(1).max(256).required().messages(ru('p256dh')),
            auth: Joi.string().min(1).max(256).required().messages(ru('auth')),
        })
            .required()
            .messages(ru('keys')),
        // expirationTime приходит из браузера как number|null (Unix-ms) — Joi
        // должен принять оба варианта.
        expirationTime: Joi.number().allow(null).optional().messages(ru('expirationTime')),
        userAgent: Joi.string().max(256).allow('').optional().messages(ru('userAgent')),
    }).unknown(false),
    params: Joi.object().unknown(true),
    query: Joi.object().unknown(true),
});

// Unsubscribe принимает endpoint в body, не в query — иначе endpoint
// (включая токены push-сервиса) попадал бы в access-логи nginx/express.
export const pushUnsubscribeSchema = Joi.object({
    body: Joi.object({
        endpoint: Joi.string()
            .uri({ scheme: ['https'] })
            .min(50)
            .max(2048)
            .required()
            .messages(ru('endpoint')),
    }).unknown(false),
    params: Joi.object().unknown(true),
    query: Joi.object().unknown(true),
});

export const userObjectsBodySchema = Joi.object({
    body: Joi.object({
        objectIds: Joi.array()
            .items(Joi.string().uuid().messages(ru('objectId')))
            .required()
            .messages(ru('objectIds')),
    }).unknown(false),
    params: Joi.object({
        userId: Joi.string().uuid().required().messages(ru('userId')),
    }),
    query: Joi.object().unknown(true),
});
