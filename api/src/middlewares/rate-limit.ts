import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

// Fallback на IP с правильной обработкой IPv6 — express-rate-limit v8 валидирует
// keyGenerator на init и кидает ERR_ERL_KEY_GEN_IPV6, если для IPv6-адресов
// возвращается голый req.ip без `ipKeyGenerator`-нормализации. Без этого
// throw на этапе require'а — rate-limit.ts падает, app.ts не загружается,
// все vitest-сьюты skip'аются на beforeAll.
const userOrIpKey = (req: any): string => {
    if (req.user?.id) return String(req.user.id);
    return ipKeyGenerator(req.ip || '');
};

// Rate-limit на чувствительные эндпоинты. В тестовом окружении отключаем,
// иначе нагрузочные сценарии (повторные login'ы в одном describe) ложно падают.
const skipInTest = () => process.env.NODE_ENV === 'test';

// Общий блок validate для всех лимитеров. В test-env отключаем validate целиком —
// иначе express-rate-limit v8 при init дёргает trust-proxy/IPv6-валидаторы на
// фейковом req без `app`, что мешает supertest'у даже когда лимитер отключён
// через skip. В prod/dev оставляем включённым — лучше ловить мискофигурации
// рано, чем терять трафик в проде на голом req.ip.
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

// Лимитер чат-сообщений: 30 за 5 минут на пользователя. В test-env отключён.
// Ключ — id пользователя (req.user.id), чтобы лимит был per-user, а не per-IP
// (несколько подрядчиков из одной сети не должны мешать друг другу).
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

// Self-binding TG: 5 init'ов за 15 минут на пользователя. В test-env отключён.
// Защита от brute-force/DoS: каждый init создаёт запись в БД и инвалидирует
// предыдущие активные токены — частые init'ы не должны быть бесплатными.
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

export default {
    loginRateLimiter,
    registerRateLimiter,
    lkCreateRequestRateLimiter,
    lkAddCommentRateLimiter,
    lkTgBindingRateLimiter,
};
