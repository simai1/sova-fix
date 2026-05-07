import webpush, { PushSubscription as WebPushSubscription, SendResult, WebPushError } from 'web-push';
import httpStatus from 'http-status';
import { Op } from 'sequelize';
import PushSubscription from '../models/pushSubscription';
import ApiError from '../utils/ApiError';
import logger from '../utils/logger';

// Контракт push-сообщения. Поля title/body уходят в системную нотификацию,
// url — целевой роут в SPA, tag — для дедупа («один и тот же тэг — одна нотификация»).
// Все строки клиент видит уже расшифрованными — не клади сюда PII (см. §7 design-doc, P-3).
export type PushPayload = {
    title: string;
    body: string;
    url?: string;
    tag?: string;
    requestId?: string;
};

export type SubscribeDto = {
    endpoint: string;
    keys: { p256dh: string; auth: string };
    expirationTime?: number | null;
    userAgent?: string | null;
};

const MAX_SUBSCRIPTIONS_PER_USER = 50;
// Срок жизни push-сообщения у push-сервиса. 5 минут — баланс между «успеть доставить
// при кратковременном офлайне устройства» и «не накапливать stale-нотификации».
const PUSH_TTL_SECONDS = 300;
const FAILURE_THRESHOLD = 5;

// Allowlist хостов реальных push-сервисов вендоров (см. §7 P-1 design-doc).
// Без allowlist'а атакующий мог бы передать `https://internal-service.local`
// в endpoint и заставить наш бэкенд слать туда web-push-запросы (SSRF).
const ALLOWED_PUSH_HOSTS_EXACT = new Set(['fcm.googleapis.com', 'web.push.apple.com']);
const ALLOWED_PUSH_HOSTS_SUFFIX = ['.push.services.mozilla.com', '.notify.windows.com'];

export const isAllowedPushHost = (endpoint: string): boolean => {
    let url: URL;
    try {
        url = new URL(endpoint);
    } catch {
        return false;
    }
    if (url.protocol !== 'https:') return false;
    const host = url.hostname.toLowerCase();
    if (ALLOWED_PUSH_HOSTS_EXACT.has(host)) return true;
    return ALLOWED_PUSH_HOSTS_SUFFIX.some(suffix => host.endsWith(suffix));
};

// Конфигурация web-push — singleton-флаг. Если хоть одной env-переменной нет,
// весь push-канал «выключен по-тихому»: subscribe-эндпоинты возвращают 503,
// sendToUsers становится no-op. Это позволяет деплоить код в прод до получения
// VAPID-ключей (§6 design-doc, «Поведение при отсутствии ключей»).
let webPushConfigured: boolean | null = null;
let webPushConfigSnapshot = '';

const getEnvSnapshot = (): string =>
    `${process.env.VAPID_PUBLIC_KEY || ''}|${process.env.VAPID_PRIVATE_KEY || ''}|${process.env.VAPID_SUBJECT || ''}`;

const ensureWebPushConfigured = (): boolean => {
    const snapshot = getEnvSnapshot();
    // Пересчитываем при изменении env (тесты переключают VAPID_* туда-сюда).
    if (snapshot !== webPushConfigSnapshot) {
        webPushConfigured = null;
        webPushConfigSnapshot = snapshot;
    }
    if (webPushConfigured !== null) return webPushConfigured;

    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT;

    if (!publicKey || !privateKey || !subject) {
        logger.info('push disabled: VAPID keys not configured');
        webPushConfigured = false;
        return false;
    }

    try {
        webpush.setVapidDetails(subject, publicKey, privateKey);
        webPushConfigured = true;
        return true;
    } catch (err) {
        logger.log({
            level: 'error',
            message: `push disabled: invalid VAPID configuration — ${(err as Error).message}`,
        });
        webPushConfigured = false;
        return false;
    }
};

export const isPushConfigured = (): boolean => ensureWebPushConfigured();

export const getVapidPublicKey = (): string => {
    if (!ensureWebPushConfigured()) {
        throw new ApiError(httpStatus.SERVICE_UNAVAILABLE, 'Push-уведомления временно недоступны');
    }
    return process.env.VAPID_PUBLIC_KEY as string;
};

const subscribe = async (userId: string, dto: SubscribeDto): Promise<{ id: string; subscribed: true }> => {
    if (!ensureWebPushConfigured()) {
        throw new ApiError(httpStatus.SERVICE_UNAVAILABLE, 'Push-уведомления не сконфигурированы');
    }
    if (!isAllowedPushHost(dto.endpoint)) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Недопустимый push-endpoint');
    }

    // Если endpoint уже занят другим юзером (расшарили устройство, потом сменили
    // юзера) — отдаём 409, чтобы не «угнать» чужую подписку молча.
    const existing = await PushSubscription.findOne({ where: { endpoint: dto.endpoint } });
    if (existing && existing.userId !== userId) {
        throw new ApiError(httpStatus.CONFLICT, 'Push-эндпоинт уже привязан к другому пользователю');
    }

    if (!existing) {
        const count = await PushSubscription.count({ where: { userId } });
        if (count >= MAX_SUBSCRIPTIONS_PER_USER) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Превышен лимит устройств для push-уведомлений');
        }
    }

    const expirationTime =
        typeof dto.expirationTime === 'number' && Number.isFinite(dto.expirationTime)
            ? new Date(dto.expirationTime)
            : null;

    if (existing) {
        await existing.update({
            p256dhKey: dto.keys.p256dh,
            authKey: dto.keys.auth,
            userAgent: dto.userAgent ?? existing.userAgent ?? null,
            expirationTime,
            lastSeenAt: new Date(),
            failureCount: 0,
        });
        return { id: existing.id, subscribed: true };
    }

    const created = await PushSubscription.create({
        userId,
        endpoint: dto.endpoint,
        p256dhKey: dto.keys.p256dh,
        authKey: dto.keys.auth,
        userAgent: dto.userAgent ?? null,
        expirationTime,
        lastSeenAt: new Date(),
        failureCount: 0,
    } as any);

    return { id: created.id, subscribed: true };
};

const unsubscribe = async (userId: string, endpoint: string): Promise<void> => {
    // Идемпотентно: даже если запись не найдена (или принадлежит другому юзеру),
    // отдаём 204 — чтобы не утекать существование чужих подписок (§3 «Ошибки»).
    await PushSubscription.destroy({ where: { userId, endpoint }, force: true });
};

const status = async (userId: string): Promise<{ subscribed: boolean; count: number }> => {
    const count = await PushSubscription.count({ where: { userId } });
    return { subscribed: count > 0, count };
};

const buildSubscriptionPayload = (sub: PushSubscription): WebPushSubscription => ({
    endpoint: sub.endpoint,
    keys: {
        p256dh: sub.p256dhKey,
        auth: sub.authKey,
    },
});

// Реакция на ответ push-сервиса для ОДНОЙ подписки. Изолирована, чтобы тесты
// могли мокать webpush.sendNotification и проверять реакцию в чистом виде.
const handlePushResult = async (sub: PushSubscription, result: PromiseSettledResult<SendResult>): Promise<void> => {
    if (result.status === 'fulfilled') {
        await sub.update({ lastSeenAt: new Date(), failureCount: 0 });
        return;
    }

    const reason = result.reason;
    const statusCode =
        reason && typeof reason === 'object' && 'statusCode' in reason
            ? (reason as WebPushError).statusCode
            : undefined;

    if (statusCode === 404 || statusCode === 410) {
        // Подписка протухла — push-сервис её больше не знает.
        await sub.destroy({ force: true });
        return;
    }

    if (typeof statusCode === 'number' && statusCode >= 500) {
        const next = (sub.failureCount ?? 0) + 1;
        if (next >= FAILURE_THRESHOLD) {
            await sub.destroy({ force: true });
            return;
        }
        await sub.update({ failureCount: next });
        return;
    }

    // Прочие ошибки (network, 4xx кроме 404/410) — логируем, счётчик не двигаем,
    // подписку оставляем (push best-effort, не наказываем юзера за временный сбой сети).
    logger.log({
        level: 'error',
        message: `push send failed for subscription ${sub.id}: ${(reason as Error)?.message || String(reason)}`,
    });
};

const sendToUsers = async (userIds: string[], payload: PushPayload): Promise<void> => {
    if (!ensureWebPushConfigured()) return;
    if (!userIds || userIds.length === 0) return;

    const subs = await PushSubscription.findAll({
        where: { userId: { [Op.in]: userIds } },
    });
    if (subs.length === 0) return;

    const body = JSON.stringify(payload);

    // Promise.allSettled — один сбой не валит остальные. Внутри handlePushResult
    // ошибки не выбрасываются, поэтому верхний catch не нужен.
    const results = await Promise.allSettled(
        subs.map(sub =>
            webpush.sendNotification(buildSubscriptionPayload(sub), body, {
                TTL: PUSH_TTL_SECONDS,
            })
        )
    );

    await Promise.all(subs.map((sub, idx) => handlePushResult(sub, results[idx])));
};

const sendTest = async (userId: string): Promise<{ sent: number }> => {
    const subs = await PushSubscription.count({ where: { userId } });
    await sendToUsers([userId], {
        title: 'sova-fix',
        body: 'Тестовое уведомление',
        url: '/lk/',
    });
    return { sent: subs };
};

export default {
    subscribe,
    unsubscribe,
    status,
    sendToUsers,
    sendTest,
    getVapidPublicKey,
    isPushConfigured,
    isAllowedPushHost,
};
