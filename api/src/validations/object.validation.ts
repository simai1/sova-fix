import Joi from 'joi';

const ru = (label: string) => ({
    'string.empty': `Поле ${label} не может быть пустым`,
    'string.base': `Поле ${label} должно быть строкой`,
    'string.guid': `Поле ${label} должно быть UUID`,
    'any.only': `Поле ${label} имеет недопустимое значение`,
});

export const getObjectsQuerySchema = Joi.object({
    body: Joi.object().unknown(true),
    params: Joi.object().unknown(true),
    query: Joi.object({
        userId: Joi.string().uuid().optional().messages(ru('userId')),
        unitId: Joi.string().uuid().optional().messages(ru('unitId')),
        tgUserId: Joi.string().optional().messages(ru('tgUserId')),
        scope: Joi.string().valid('requests').optional().messages(ru('scope')),
    }).unknown(false),
});
