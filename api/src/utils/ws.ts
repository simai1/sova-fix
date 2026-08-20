import crypto from 'crypto';
import type { WebSocket as WsWebSocket } from 'ws';
import WebSocket from 'ws';
import { aWss } from '../expressApp';
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
    isPending?: boolean;
};

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

export const pickSubprotocol = (raw: string | string[] | undefined): string | null => {
    if (!raw) return null;
    const list = Array.isArray(raw) ? raw : raw.split(',');
    for (const item of list) {
        const trimmed = item.trim();
        if (trimmed) return trimmed;
    }
    return null;
};

export const authenticateSubprotocol = async (subprotocol: string | null): Promise<WsUser | null> => {
    if (!subprotocol) return null;

    if (subprotocol.startsWith('bot.')) {
        const masterKey = process.env.MASTER_API_KEY ?? '';
        if (!masterKey) return null;
        const provided = subprotocol.slice('bot.'.length);
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
            if (!user.isActivated && user.pendingVerifyToken) return null;
            if (user.isDisabled) return null;

            return { userId: user.id, role: user.role, isBot: false };
        } catch {
            return null;
        }
    }

    if (subprotocol.startsWith('pending.')) {
        const provided = subprotocol.slice('pending.'.length);
        if (!provided) return null;
        const hash = crypto.createHash('sha256').update(provided).digest('hex');
        const user = await User.findOne({ where: { pendingVerifyToken: hash } });
        if (!user) return null;
        if (user.isActivated) return null;
        if (!user.pendingVerifyTokenExpiresAt || new Date(user.pendingVerifyTokenExpiresAt).getTime() < Date.now()) {
            return null;
        }
        return { userId: user.id, role: null, isBot: false, isPending: true };
    }

    return null;
};

export const registerClient = (ws: AuthedWs, user: WsUser): void => {
    ws._user = user;
    ws._subscriptions = new Set();
};

export const unregisterClient = (ws: AuthedWs): void => {
    ws._subscriptions?.clear();
    ws._user = undefined;
    ws._subscriptions = undefined;
};

type SubscribeResult = 'ok' | 'not_found' | 'forbidden';

export const ensureSubscribeAccess = async (user: WsUser, requestId: string): Promise<SubscribeResult> => {
    if (user.isBot) return 'ok';
    if (user.isPending) return 'forbidden';
    if (!user.userId) return 'forbidden';

    const repairRequest = await RepairRequest.findByPk(requestId);
    if (!repairRequest) return 'not_found';

    const currentUser = await User.findByPk(user.userId);
    if (!currentUser || !currentUser.isActivated) return 'forbidden';
    if (currentUser.isDisabled) return 'forbidden';
    const roleNumber = currentUser.role;
    const roleName: 'CONTRACTOR' | 'CUSTOMER' | 'ADMIN' | 'MANAGER' =
        roleNumber === roles.ADMIN
            ? 'ADMIN'
            : roleNumber === roles.MANAGER
              ? 'MANAGER'
              : roleNumber === roles.CONTRACTOR
                ? 'CONTRACTOR'
                : 'CUSTOMER';
    const ctx = await lkService.loadUserContext(user.userId);
    const canRead = lkService.canRead(repairRequest, roleName, {
        contractor: ctx.contractor,
        objectIds: ctx.objectIds,
        userId: user.userId,
    });
    return canRead ? 'ok' : 'forbidden';
};

export const handleClientFrame = async (ws: AuthedWs, raw: WebSocket.RawData): Promise<void> => {
    if (!ws._user) return;

    let parsed: any;
    try {
        parsed = JSON.parse(raw.toString());
    } catch {
        try {
            ws.send(JSON.stringify({ type: 'error', code: 'invalid_frame' }));
        } catch {
            return;
        }
        return;
    }

    const type: unknown = parsed?.type;
    const requestId: unknown = parsed?.requestId;

    if ((type !== 'subscribe' && type !== 'unsubscribe') || typeof requestId !== 'string' || !requestId) {
        try {
            ws.send(JSON.stringify({ type: 'error', code: 'invalid_frame' }));
        } catch {
            return;
        }
        return;
    }

    if (type === 'unsubscribe') {
        ws._subscriptions?.delete(requestId);
        try {
            ws.send(JSON.stringify({ type: 'unsubscribed', requestId }));
        } catch {
            return;
        }
        return;
    }

    const result = await ensureSubscribeAccess(ws._user, requestId);
    if (result === 'not_found') {
        try {
            ws.send(JSON.stringify({ type: 'error', code: 'not_found', requestId }));
        } catch {
            return;
        }
        return;
    }
    if (result === 'forbidden') {
        try {
            ws.send(JSON.stringify({ type: 'error', code: 'forbidden', requestId }));
        } catch {
            return;
        }
        return;
    }

    ws._subscriptions?.add(requestId);
    try {
        ws.send(JSON.stringify({ type: 'subscribed', requestId }));
    } catch {
        return;
    }
};

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
 * Принудительно закрывает все открытые сокеты пользователя. Нужен при отключении
 * доступа: без этого уже установленное ws-соединение продолжает жить и получать
 * события, потому что authenticateSubprotocol проверяется только при подключении.
 */
export const disconnectUser = (userId: string, reason = 'access_disabled'): void => {
    aWss.clients.forEach(rawClient => {
        const client = rawClient as AuthedWs;
        if (client._user?.userId !== userId) return;
        try {
            client.close(4003, reason);
        } catch (err) {
            logger.log({
                level: 'error',
                message: `[ws.disconnectUser] close failed: ${(err as Error).message}`,
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
