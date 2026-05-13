import crypto from 'crypto';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { AddressInfo } from 'net';
import http from 'http';
import WebSocket from 'ws';
import app from '../../src/app';
import User from '../../src/models/user';
import userService from '../../src/services/user.service';
import { encrypt } from '../../src/utils/encryption';
import roles from '../../src/config/roles';
import wsEvents from '../../src/config/wsEvents';

// Поднимаем настоящий http-сервер для каждого WS-теста: express-ws вешает
// upgrade-handler на server, и без listen() рукопожатие не доходит до нашего
// app.ws('/'). Используем ephemeral-port (port: 0).
const startServer = (): Promise<{ server: http.Server; port: number }> =>
    new Promise(resolve => {
        const server = app.listen(0, () => {
            const port = (server.address() as AddressInfo).port;
            resolve({ server, port });
        });
    });

const stopServer = (server: http.Server): Promise<void> => new Promise(resolve => server.close(() => resolve()));

// Хелпер: открывает WS с заданным subprotocol и ждёт стабильного состояния.
// express-ws всегда даёт upgrade (HTTP 101 + open-event) ДО того, как наш
// app.ws-handler решит, закрывать или нет. Поэтому 'open' всегда срабатывает —
// а 'close' для отказа приходит сразу следом. Чтобы различать, выждем 250ms
// после open: если за это время пришёл close — это отказ; если нет — соединение
// действительно живое.
type HandshakeResult = { kind: 'open'; ws: WebSocket } | { kind: 'close'; code: number; reason: string };

const handshake = (url: string, subprotocols: string[]): Promise<HandshakeResult> =>
    new Promise((resolve, reject) => {
        const ws = new WebSocket(url, subprotocols);
        let opened = false;
        let settled = false;
        const overall = setTimeout(() => {
            if (settled) return;
            settled = true;
            try {
                ws.terminate();
            } catch {
                /* noop */
            }
            reject(new Error('handshake timeout'));
        }, 2500);
        ws.once('open', () => {
            opened = true;
            // Даём серверу шанс закрыть (1008) после успешного upgrade.
            setTimeout(() => {
                if (settled) return;
                settled = true;
                clearTimeout(overall);
                resolve({ kind: 'open', ws });
            }, 250);
        });
        ws.once('close', (code, reasonBuf) => {
            if (settled) return;
            settled = true;
            clearTimeout(overall);
            resolve({ kind: 'close', code, reason: reasonBuf?.toString() ?? '' });
            void opened;
        });
        ws.once('error', () => {
            // 'error' приходит вместе с 'close' для отказов upgrade —
            // не reject'им, ждём 'close'.
        });
    });

describe('WS handshake — pending.<verifyToken>', () => {
    const login = 'ws-pending@test.local';
    let server: http.Server;
    let port: number;
    let plainToken: string;
    let userId: string;

    beforeAll(async () => {
        const res = await startServer();
        server = res.server;
        port = res.port;
    });

    afterAll(async () => {
        await stopServer(server);
        await User.destroy({ where: { login }, force: true });
    });

    beforeEach(async () => {
        await User.destroy({ where: { login }, force: true });
        const user = await User.create({
            login,
            password: await encrypt('pass1234'),
            name: 'Pending WS',
            role: roles.CONTRACTOR,
            // Объединённая семантика: web-self-reg pending = isActivated:false +
            // живой pendingVerifyToken. После approve флаг переключится в true.
            isActivated: false,
        });
        userId = user.id;
        plainToken = crypto.randomBytes(32).toString('hex');
        const hash = crypto.createHash('sha256').update(plainToken).digest('hex');
        await user.update({
            pendingVerifyToken: hash,
            pendingVerifyTokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });
    });

    it('валидный токен → connection open', async () => {
        const result = await handshake(`ws://127.0.0.1:${port}/`, [`pending.${plainToken}`]);
        expect(result.kind).toBe('open');
        if (result.kind === 'open') {
            result.ws.terminate();
        }
    });

    it('битый токен → close 1008', async () => {
        const result = await handshake(`ws://127.0.0.1:${port}/`, [`pending.${'a'.repeat(64)}`]);
        expect(result.kind).toBe('close');
        if (result.kind === 'close') {
            expect(result.code).toBe(1008);
        }
    });

    it('approved юзер с тем же токеном → close 1008', async () => {
        // Эмуляция: isActivated=true, но токен мы не успели обнулить.
        // approveUser делает это в одной транзакции — здесь лезем в БД сами.
        await User.update({ isActivated: true }, { where: { id: userId } });
        const result = await handshake(`ws://127.0.0.1:${port}/`, [`pending.${plainToken}`]);
        expect(result.kind).toBe('close');
        if (result.kind === 'close') {
            expect(result.code).toBe(1008);
        }
    });

    it('истёкший expiresAt → close 1008', async () => {
        await User.update({ pendingVerifyTokenExpiresAt: new Date(Date.now() - 60_000) }, { where: { id: userId } });
        const result = await handshake(`ws://127.0.0.1:${port}/`, [`pending.${plainToken}`]);
        expect(result.kind).toBe('close');
        if (result.kind === 'close') {
            expect(result.code).toBe(1008);
        }
    });

    it('subscribe-фрейм от pending → ответ {error, forbidden}, соединение живо', async () => {
        const result = await handshake(`ws://127.0.0.1:${port}/`, [`pending.${plainToken}`]);
        expect(result.kind).toBe('open');
        if (result.kind !== 'open') return;
        const ws = result.ws;

        const reply = await new Promise<any>((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error('no reply')), 1000);
            ws.once('message', data => {
                clearTimeout(timer);
                try {
                    resolve(JSON.parse(data.toString()));
                } catch (e) {
                    reject(e);
                }
            });
            ws.send(
                JSON.stringify({
                    type: 'subscribe',
                    requestId: '00000000-0000-4000-8000-000000000001',
                })
            );
        });
        expect(reply).toMatchObject({ type: 'error', code: 'forbidden' });
        // Соединение должно остаться открытым: invalid subscribe не повод
        // ронять сокет (как и для bearer-клиентов).
        expect(ws.readyState).toBe(WebSocket.OPEN);
        ws.terminate();
    });

    it('approveUser → pending-клиент получает USER_CONFIRM, токен обнуляется в БД', async () => {
        const open = await handshake(`ws://127.0.0.1:${port}/`, [`pending.${plainToken}`]);
        expect(open.kind).toBe('open');
        if (open.kind !== 'open') return;
        const ws = open.ws;

        const got = new Promise<any>((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error('no USER_CONFIRM')), 1500);
            ws.on('message', data => {
                try {
                    const msg = JSON.parse(data.toString());
                    if (msg?.event === wsEvents.USER_CONFIRM) {
                        clearTimeout(timer);
                        resolve(msg);
                    }
                } catch {
                    /* noop */
                }
            });
        });

        await userService.approveUser(userId);
        const msg = await got;
        expect(msg).toMatchObject({ event: wsEvents.USER_CONFIRM });
        expect(msg.msg).toMatchObject({ userId });

        const u = await User.findByPk(userId);
        expect(u?.pendingVerifyToken).toBeNull();
        expect(u?.pendingVerifyTokenExpiresAt).toBeNull();
        ws.terminate();

        // Повторный handshake тем же токеном должен закрываться 1008.
        const after = await handshake(`ws://127.0.0.1:${port}/`, [`pending.${plainToken}`]);
        expect(after.kind).toBe('close');
        if (after.kind === 'close') {
            expect(after.code).toBe(1008);
        }
    });
});
