import webpush, { PushSubscription as WebPushSubscription, SendResult, WebPushError } from 'web-push';
import httpStatus from 'http-status';
import { Op } from 'sequelize';
import PushSubscription from '../models/pushSubscription';
import User from '../models/user';
import ApiError from '../utils/ApiError';
import logger from '../utils/logger';

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
const PUSH_TTL_SECONDS = 300;
const FAILURE_THRESHOLD = 5;

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

let webPushConfigured: boolean | null = null;
let webPushConfigSnapshot = '';

const getEnvSnapshot = (): string =>
    `${process.env.VAPID_PUBLIC_KEY || ''}|${process.env.VAPID_PRIVATE_KEY || ''}|${process.env.VAPID_SUBJECT || ''}`;

const ensureWebPushConfigured = (): boolean => {
    const snapshot = getEnvSnapshot();
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

    logger.log({
        level: 'error',
        message: `push send failed for subscription ${sub.id}: ${(reason as Error)?.message || String(reason)}`,
    });
};

const sendToUsers = async (userIds: string[], payload: PushPayload): Promise<void> => {
    if (!ensureWebPushConfigured()) return;
    if (!userIds || userIds.length === 0) return;

    // Подписки отключённого пользователя удаляются в user.service.setUserDisabled,
    // но join страхует от гонки и от подписок, созданных до отключения.
    const subs = await PushSubscription.findAll({
        where: { userId: { [Op.in]: userIds } },
        include: [{ model: User, attributes: [], required: true, where: { isDisabled: false } }],
    });
    if (subs.length === 0) return;

    const body = JSON.stringify(payload);

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
