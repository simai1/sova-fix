import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

const userOrIpKey = (req: any): string => {
    if (req.user?.id) return String(req.user.id);
    return ipKeyGenerator(req.ip || '');
};

const skipInTest = () => process.env.NODE_ENV === 'test';

const validateOpts = process.env.NODE_ENV === 'test' ? false : undefined;

export const loginRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    skip: skipInTest,
    keyGenerator: userOrIpKey,
    validate: validateOpts,
    message: { message: 'Слишком много попыток входа. Попробуйте через 15 минут' },
});

export const registerRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    skip: skipInTest,
    keyGenerator: userOrIpKey,
    validate: validateOpts,
    message: { message: 'Слишком много попыток регистрации. Попробуйте позже' },
});

export const lkCreateRequestRateLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    skip: skipInTest,
    keyGenerator: userOrIpKey,
    validate: validateOpts,
    message: { message: 'Слишком много заявок. Подождите немного' },
});

export const lkAddCommentRateLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    skip: skipInTest,
    keyGenerator: userOrIpKey,
    validate: validateOpts,
    message: { message: 'Слишком много сообщений. Подождите немного' },
});

export const lkTgBindingRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    skip: skipInTest,
    keyGenerator: userOrIpKey,
    validate: validateOpts,
    message: { message: 'Слишком частые попытки привязки. Подождите.' },
});

export const lkPushSubscribeRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    skip: skipInTest,
    keyGenerator: userOrIpKey,
    validate: validateOpts,
    message: { message: 'Слишком частые запросы. Попробуйте позже.' },
});

export const lkPushTestRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    skip: skipInTest,
    keyGenerator: userOrIpKey,
    validate: validateOpts,
    message: { message: 'Слишком частые запросы. Попробуйте позже.' },
});

export default {
    loginRateLimiter,
    registerRateLimiter,
    lkCreateRequestRateLimiter,
    lkAddCommentRateLimiter,
    lkTgBindingRateLimiter,
    lkPushSubscribeRateLimiter,
    lkPushTestRateLimiter,
};
