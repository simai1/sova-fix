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
        sort: Joi.string().valid('createdAt', 'status', 'urgency', 'date').optional().messages(ru('sort')),
        order: Joi.string().valid('asc', 'desc', 'ASC', 'DESC').optional().messages(ru('order')),
        mine: Joi.boolean().optional().messages(ru('mine')),
    }).unknown(false),
});

export const createRequestSchema = Joi.object({
    body: Joi.object({
        objectId: Joi.string().uuid().required().messages(ru('objectId')),
        problemDescription: Joi.string().min(1).max(1000).required().messages(ru('problemDescription')),
        urgencyId: Joi.string().uuid().required().messages(ru('urgencyId')),
        directoryCategoryId: Joi.string().uuid().optional().messages(ru('directoryCategoryId')),
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

export const exitDateSchema = Joi.object({
    body: Joi.object({
        exitDate: Joi.date().iso().allow(null).required().messages(ru('exitDate')),
    }).unknown(false),
    params: Joi.object({
        id: Joi.string().uuid().required().messages(ru('id')),
    }),
    query: Joi.object().unknown(true),
});

export const addCommentSchema = Joi.object({
    body: Joi.object({
        text: Joi.string().min(1).max(4000).required().messages(ru('text')),
    }).unknown(false),
    params: Joi.object({
        id: Joi.string().uuid().required().messages(ru('id')),
    }),
    query: Joi.object().unknown(true),
});

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
        expirationTime: Joi.number().allow(null).optional().messages(ru('expirationTime')),
        userAgent: Joi.string().max(256).allow('').optional().messages(ru('userAgent')),
    }).unknown(false),
    params: Joi.object().unknown(true),
    query: Joi.object().unknown(true),
});

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
