import Joi from 'joi';

export const setDisabledSchema = Joi.object({
    params: Joi.object().unknown(true),
    query: Joi.object().unknown(true),
    body: Joi.object({
        disabled: Joi.boolean().required().messages({
            'boolean.base': 'Поле disabled должно быть true или false',
            'any.required': 'Поле disabled обязательно',
        }),
    }).required(),
});
