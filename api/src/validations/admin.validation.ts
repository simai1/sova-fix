import Joi from 'joi';

const ru = (label: string) => ({
    'string.empty': `Поле ${label} не может быть пустым`,
    'string.base': `Поле ${label} должно быть строкой`,
    'string.max': `Поле ${label} превышает допустимую длину`,
    'any.required': `Поле ${label} обязательно`,
    'any.only': `Поле ${label} имеет недопустимое значение`,
    'number.base': `Поле ${label} должно быть числом`,
    'number.integer': `Поле ${label} должно быть целым числом`,
    'number.min': `Поле ${label} меньше допустимого минимума`,
    'number.max': `Поле ${label} больше допустимого максимума`,
    'date.base': `Поле ${label} должно быть датой`,
});

export const listLogsQuerySchema = Joi.object({
    body: Joi.object().unknown(true),
    params: Joi.object().unknown(true),
    query: Joi.object({
        level: Joi.string().valid('info', 'warn', 'error', 'all').optional().messages(ru('level')),
        from: Joi.date().iso().optional().messages(ru('from')),
        to: Joi.date().iso().optional().messages(ru('to')),
        q: Joi.string().allow('').max(200).optional().messages(ru('q')),
        limit: Joi.number().integer().min(1).max(200).optional().messages(ru('limit')),
        cursor: Joi.date().iso().optional().messages(ru('cursor')),
    }).unknown(false),
});
