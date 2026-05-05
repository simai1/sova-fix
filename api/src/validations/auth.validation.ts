import Joi from 'joi';

export const registerPublicSchema = Joi.object({
    body: Joi.object({
        login: Joi.string().email().required().messages({
            'string.email': 'Укажите корректный email',
            'string.empty': 'Email обязателен',
            'any.required': 'Email обязателен',
        }),
        password: Joi.string().min(6).max(100).required().messages({
            'string.min': 'Пароль должен быть минимум 6 символов',
            'string.empty': 'Пароль обязателен',
            'any.required': 'Пароль обязателен',
        }),
        name: Joi.string().trim().min(1).required().messages({
            'string.empty': 'Имя обязательно',
            'any.required': 'Имя обязательно',
        }),
        role: Joi.number().valid(3, 4).required().messages({
            'any.only': 'Выберите корректную роль (Заказчик или Исполнитель)',
            'any.required': 'Роль обязательна',
        }),
    }),
    params: Joi.object().unknown(true),
    query: Joi.object().unknown(true),
});

export const loginSchema = Joi.object({
    body: Joi.object({
        login: Joi.string().required().messages({
            'string.empty': 'Логин обязателен',
            'any.required': 'Логин обязателен',
        }),
        password: Joi.string().required().messages({
            'string.empty': 'Пароль обязателен',
            'any.required': 'Пароль обязателен',
        }),
    }),
    params: Joi.object().unknown(true),
    query: Joi.object().unknown(true),
});
