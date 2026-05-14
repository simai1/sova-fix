import Joi from 'joi';

const ru = (label: string) => ({
    'string.empty': `Поле ${label} не может быть пустым`,
    'string.base': `Поле ${label} должно быть строкой`,
    'string.guid': `Поле ${label} должно быть UUID`,
    'any.only': `Поле ${label} имеет недопустимое значение`,
});

// GET /objects — фильтры опциональные, но если переданы, валидируем форму:
// userId/unitId — UUID (модели User.id и ObjectUnit.id — UUID).
// tgUserId — Telegram-id (любая строка, бот шлёт строковое число).
// Запрет на литералку "undefined": фронт раньше слал `?userId=undefined`,
// контроллер уходил в ветку `if (userId)` и падал на `findOne` с невалидным UUID.
export const getObjectsQuerySchema = Joi.object({
    body: Joi.object().unknown(true),
    params: Joi.object().unknown(true),
    query: Joi.object({
        userId: Joi.string().uuid().optional().messages(ru('userId')),
        unitId: Joi.string().uuid().optional().messages(ru('unitId')),
        tgUserId: Joi.string().optional().messages(ru('tgUserId')),
    }).unknown(false),
});
