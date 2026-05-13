// WebSocket-инфраструктура с handshake-аутентификацией и таргетируемой рассылкой.
//
// Архитектура (см. .memory-base/specs/2026-05-07-contractor-lk-followups-design.md §E):
//   - handshake: subprotocol Sec-WebSocket-Protocol = "bearer.<jwt>" | "bot.<MASTER_API_KEY>".
//   - на каждый сокет вешаем `_user`/`_subscriptions` через registerClient/unregisterClient.
//   - клиенты подписываются на события заявки фреймом { type: 'subscribe', requestId }.
//   - emitTo(audience, event, msg) шлёт нужной аудитории; broadcast — только legacy-бот.
//
// PII-безопасность:
//   - бот получает ВСЕ события (broadcast + любой targeted emit), потому что у
//     него master-key и доступ к API. Это нужно до удаления бота.
//   - веб-клиенты получают только то, на что подписаны / что адресовано
//     их userId / role. На фрейм subscribe сервер проверяет read-доступ к заявке
//     через lk.service.canRead — без подписки клиент не получит COMMENT_CREATE.

import crypto from 'crypto';
import type { WebSocket as WsWebSocket } from 'ws';
import WebSocket from 'ws';
import { aWss } from '../app';
import jwtUtils from './jwt';
import logger from './logger';
import roles from '../config/roles';
import User from '../models/user';
import RepairRequest from '../models/repairRequest';
import lkService from '../services/lk.service';

type WsUser = {
    userId: string | null;
    role: number | null;
    isBot: boolean;
    // Pending-юзер: подключён через subprotocol pending.<verifyToken> на странице
    // ожидания approve. У него ещё нет access-токена и role=null. Может слушать
    // USER_CONFIRM (через kind:'user', userId=this.userId), но НЕ может
    // subscribe'нуться на requestId — это закрывается в ensureSubscribeAccess.
    isPending?: boolean;
};

// Расширяем тип WebSocket-клиента, чтобы хранить состояние сессии прямо на нём.
// Альтернатива — WeakMap; кладём на инстанс, потому что express-ws не возвращает
// одного и того же клиента из aWss.clients (он Set<WebSocket>).
export type AuthedWs = WsWebSocket & {
    _user?: WsUser;
    _subscriptions?: Set<string>;
};

export type WsMsgData = {
    msg: any;
    event: string;
};

export type Audience =
    | { kind: 'broadcast' }
    | { kind: 'user'; userId: string }
    | { kind: 'users'; userIds: string[] }
    | { kind: 'role'; roles: number[] }
    | { kind: 'request'; requestId: string };

// =====================
// Handshake / authentication
// =====================

// `Sec-WebSocket-Protocol` приходит строкой через запятую, либо массивом — при
// подключении через `new WebSocket(url, ['bearer.xxx'])` браузер пошлёт ровно
// один subprotocol. Берём первый непустой и обрезаем пробелы.
export const pickSubprotocol = (raw: string | string[] | undefined): string | null => {
    if (!raw) return null;
    const list = Array.isArray(raw) ? raw : raw.split(',');
    for (const item of list) {
        const trimmed = item.trim();
        if (trimmed) return trimmed;
    }
    return null;
};

// Декодирует subprotocol. Возвращает WsUser или null, если auth failed —
// **не** бросает: вызывающий должен закрыть соединение с кодом 1008.
export const authenticateSubprotocol = async (subprotocol: string | null): Promise<WsUser | null> => {
    if (!subprotocol) return null;

    if (subprotocol.startsWith('bot.')) {
        const masterKey = process.env.MASTER_API_KEY ?? '';
        if (!masterKey) return null;
        const provided = subprotocol.slice('bot.'.length);
        // Timing-safe сравнение (sec-audit M-5, ровно как в verify-ApiKey.ts):
        // обычный `!==` short-circuit'ит на первом несовпадающем байте, что
        // позволяет восстанавливать master-key через timing-side-channel.
        const a = Buffer.from(provided);
        const b = Buffer.from(masterKey);
        if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
        return { userId: null, role: null, isBot: true };
    }

    if (subprotocol.startsWith('bearer.')) {
        const token = subprotocol.slice('bearer.'.length);
        if (!token) return null;
        try {
            const payload = jwtUtils.verifyAccessToken(token);
            if (!payload || typeof payload !== 'object') return null;
            const userId = (payload as { id?: string }).id;
            if (!userId) return null;

            const user = await User.findByPk(userId);
            if (!user) return null;
            // Web-self-reg pending-юзер не может открывать bearer ws-сессию:
            // его JWT либо не выдан (login возвращает 401), либо выдан до
            // approve — в любом случае для авторизованного канала он не
            // подходит. Признак — `!isActivated && pendingVerifyToken`
            // (тот же критерий, что в auth.service.login).
            if (!user.isActivated && user.pendingVerifyToken) return null;

            return { userId: user.id, role: user.role, isBot: false };
        } catch {
            return null;
        }
    }

    if (subprotocol.startsWith('pending.')) {
        const provided = subprotocol.slice('pending.'.length);
        if (!provided) return null;
        // sha256(plain) — то же преобразование, что в auth.service.registerPublic.
        // Хеш сравниваем через findOne — timing-side-channel здесь не страшен:
        // вход в БД-запрос на порядки медленнее, чем разница в string-compare,
        // и plain-токен не утекает (мы сравниваем уже хеши).
        const hash = crypto.createHash('sha256').update(provided).digest('hex');
        const user = await User.findOne({ where: { pendingVerifyToken: hash } });
        if (!user) return null;
        // approve уже был, но токен почему-то ещё не обнулился — отказываем.
        // approveUser обнуляет токен в одной транзакции с isActivated:true,
        // так что эта ветка должна быть мёртвой. Дополнительная защита от
        // ошибочной ручной правки БД.
        if (user.isActivated) return null;
        if (!user.pendingVerifyTokenExpiresAt || new Date(user.pendingVerifyTokenExpiresAt).getTime() < Date.now()) {
            return null;
        }
        return { userId: user.id, role: null, isBot: false, isPending: true };
    }

    return null;
};

// Регистрирует клиента: проставляет _user и пустой Set подписок.
// Вызывается из app.ws('/', ...) после успешной аутентификации.
export const registerClient = (ws: AuthedWs, user: WsUser): void => {
    ws._user = user;
    ws._subscriptions = new Set();
};

export const unregisterClient = (ws: AuthedWs): void => {
    ws._subscriptions?.clear();
    ws._user = undefined;
    ws._subscriptions = undefined;
};

// =====================
// Subscribe / unsubscribe
// =====================

// Проверка read-доступа для подписки. Переиспользует lk.service.canRead,
// чтобы единая политика жила в одном месте (см. require-request-access middleware).
// Возвращает 'ok' | 'not_found' | 'forbidden'.
type SubscribeResult = 'ok' | 'not_found' | 'forbidden';

export const ensureSubscribeAccess = async (user: WsUser, requestId: string): Promise<SubscribeResult> => {
    // Бот видит всё (legacy) — пускаем без проверки.
    if (user.isBot) return 'ok';
    // Pending-юзер не имеет ни role, ни доступа к заявкам — он подключён
    // только чтобы слышать USER_CONFIRM на свой userId. Любые subscribe-фреймы
    // от него отвергаем без обращения к БД, чтобы исключить даже намёк на
    // утечку чужих заявок через этот канал.
    if (user.isPending) return 'forbidden';
    if (!user.userId) return 'forbidden';

    const repairRequest = await RepairRequest.findByPk(requestId);
    if (!repairRequest) return 'not_found';

    const roleNumber = user.role ?? 0;
    const roleName: 'CONTRACTOR' | 'CUSTOMER' | 'ADMIN' =
        roleNumber === roles.ADMIN ? 'ADMIN' : roleNumber === roles.CONTRACTOR ? 'CONTRACTOR' : 'CUSTOMER';
    const ctx = await lkService.loadUserContext(user.userId);
    const canRead = lkService.canRead(repairRequest, roleName, {
        contractor: ctx.contractor,
        objectIds: ctx.objectIds,
        userId: user.userId,
    });
    return canRead ? 'ok' : 'forbidden';
};

// Обработка входящего фрейма от клиента. Не закрываем соединение на ошибки,
// чтобы клиент мог повторить — закрытие при invalid frame было бы агрессивно
// и сложнее для UX (клиент не отличит «токен истёк» от «опечатка во фрейме»).
export const handleClientFrame = async (ws: AuthedWs, raw: WebSocket.RawData): Promise<void> => {
    if (!ws._user) return;

    let parsed: any;
    try {
        parsed = JSON.parse(raw.toString());
    } catch {
        try {
            ws.send(JSON.stringify({ type: 'error', code: 'invalid_frame' }));
        } catch {
            /* noop */
        }
        return;
    }

    const type: unknown = parsed?.type;
    const requestId: unknown = parsed?.requestId;

    if ((type !== 'subscribe' && type !== 'unsubscribe') || typeof requestId !== 'string' || !requestId) {
        try {
            ws.send(JSON.stringify({ type: 'error', code: 'invalid_frame' }));
        } catch {
            /* noop */
        }
        return;
    }

    if (type === 'unsubscribe') {
        ws._subscriptions?.delete(requestId);
        try {
            ws.send(JSON.stringify({ type: 'unsubscribed', requestId }));
        } catch {
            /* noop */
        }
        return;
    }

    const result = await ensureSubscribeAccess(ws._user, requestId);
    if (result === 'not_found') {
        try {
            ws.send(JSON.stringify({ type: 'error', code: 'not_found', requestId }));
        } catch {
            /* noop */
        }
        return;
    }
    if (result === 'forbidden') {
        try {
            ws.send(JSON.stringify({ type: 'error', code: 'forbidden', requestId }));
        } catch {
            /* noop */
        }
        return;
    }

    ws._subscriptions?.add(requestId);
    try {
        ws.send(JSON.stringify({ type: 'subscribed', requestId }));
    } catch {
        /* noop */
    }
};

// =====================
// emitTo / sendMsg
// =====================

// Boт проходит через любую таргетированную аудиторию: его роль не помечена,
// userId нет, но он явно `isBot` — единственный способ доставить ему все события
// до удаления бота. После удаления — убираем эту ветку и `kind:'broadcast'` целиком.
const matchAudience = (client: AuthedWs, audience: Audience): boolean => {
    const user = client._user;
    if (!user) return false;
    if (audience.kind === 'broadcast') return true;
    if (user.isBot) return true;

    switch (audience.kind) {
        case 'user':
            return user.userId === audience.userId;
        case 'users':
            return !!user.userId && audience.userIds.includes(user.userId);
        case 'role':
            return user.role !== null && audience.roles.includes(user.role);
        case 'request':
            return !!client._subscriptions && client._subscriptions.has(audience.requestId);
        default:
            return false;
    }
};

const safeStringify = (value: any): string | null => {
    try {
        return JSON.stringify(value);
    } catch (err) {
        logger.log({
            level: 'error',
            message: `[ws.emitTo] failed to stringify payload: ${(err as Error).message}`,
        });
        return null;
    }
};

export const emitTo = (audience: Audience, event: string, msg: any): void => {
    const payload: WsMsgData = { msg, event };
    const data = safeStringify(payload);
    if (!data) return;

    aWss.clients.forEach(rawClient => {
        const client = rawClient as AuthedWs;
        if (client.readyState !== WebSocket.OPEN) return;
        if (!matchAudience(client, audience)) return;
        try {
            client.send(data);
        } catch (err) {
            logger.log({
                level: 'error',
                message: `[ws.emitTo] send failed: ${(err as Error).message}`,
            });
        }
    });
};

/**
 * Тонкая обёртка над broadcast-аудиторией. Сохранена для обратной совместимости
 * (legacy-вызовы, которые ещё не мигрированы на emitTo с конкретной аудиторией —
 * например, бот-flow `TGUSER_CREATE`/`TGUSER_CONFIRM`). Доходит **до всех**
 * подключённых клиентов, включая бота. Не использовать в новом коде.
 *
 * @deprecated Use emitTo({ kind: 'request' | 'role' | 'user' | 'users' }, event, msg).
 */
const sendMsg = (data: WsMsgData): void => {
    emitTo({ kind: 'broadcast' }, data.event, data.msg);
};

export { sendMsg };
