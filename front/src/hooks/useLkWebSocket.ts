import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';

import { lkApi, MeDto } from '@/API/rtkQuery/lk.api';
import { showToast } from '@/components/Lk/toastBus';
import { WS_URL } from '@/constants/env.constant';
import { lkSocket } from '@/utils/lkSocket';

const RECONNECT_INITIAL = 1000;
const RECONNECT_MAX = 30000;

type WsMessage = {
  type?: string;
  event?: string;
  requestId?: string;
  contractorId?: string;
  objectId?: string;
  authorUserId?: string;
  commentId?: string;
  userId?: string;
  [k: string]: unknown;
};

const KNOWN_EVENTS = new Set([
  'STATUS_UPDATE',
  'COMMENT_UPDATE',
  'URGENCY_UPDATE',
  'REQUEST_CREATE',
  'REQUEST_ASSIGNED',
  'COMMENT_CREATE',
  'USER_TG_BIND_OK',
]);

// Достаём JWT из sessionStorage. Auth-флоу пишет access-token туда же,
// где и userData (см. API/API.js / utils/auth.ts).
const getAccessToken = (): string | null => {
  try {
    const t = sessionStorage.getItem('accessToken');
    return t && t !== 'null' ? t : null;
  } catch {
    return null;
  }
};

export function useLkWebSocket(me: MeDto | undefined): void {
  const dispatch = useDispatch();
  // Идемпотентность для StrictMode: храним сокет/таймер в ref, очищаем в cleanup
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectDelayRef = useRef<number>(RECONNECT_INITIAL);
  const reconnectTimerRef = useRef<number | null>(null);
  const closedManuallyRef = useRef<boolean>(false);
  const meRef = useRef<MeDto | undefined>(me);
  meRef.current = me;

  useEffect(() => {
    if (!WS_URL) return;
    closedManuallyRef.current = false;

    const connect = (): void => {
      const token = getAccessToken();
      if (!token) {
        // Без токена ws-handshake завершится 1008. Не шумим reconnect-циклом —
        // подождём, пока юзер залогинится и вернётся в LK с новым токеном.
        return;
      }

      let ws: WebSocket;
      try {
        // Subprotocol-формат "bearer.<jwt>" согласован с api/src/utils/ws.ts.
        // Браузер передаст токен в заголовке Sec-WebSocket-Protocol при upgrade,
        // в логах reverse-proxy он не остаётся (в отличие от query-string).
        ws = new WebSocket(WS_URL, [`bearer.${token}`]);
      } catch {
        scheduleReconnect();
        return;
      }
      socketRef.current = ws;
      lkSocket.attach(ws);

      ws.onopen = () => {
        // Сброс backoff на успешном open — следующий разрыв стартует с 1с
        reconnectDelayRef.current = RECONNECT_INITIAL;
        // Переподписка на все активные requestId (после reconnect).
        lkSocket.resubscribeAll();
      };

      ws.onmessage = (ev) => {
        let msg: WsMessage | string = ev.data;
        try {
          msg = JSON.parse(ev.data) as WsMessage;
        } catch {
          // не JSON — может быть строкой-литералом (TGUSER_*); игнорируем
        }
        const evType = typeof msg === 'string' ? msg : (msg.type ?? msg.event ?? '');
        // Сервер шлёт control-фреймы { type: 'subscribed' | 'unsubscribed' | 'error', ... }
        // в ответ на наши subscribe/unsubscribe — для UI они не интересны, не реагируем.
        if (
          typeof msg === 'object' &&
          msg !== null &&
          ['subscribed', 'unsubscribed', 'error'].includes(String(msg.type ?? ''))
        ) {
          return;
        }
        if (!KNOWN_EVENTS.has(evType)) return;

        // Бэкенд кладёт детальный payload либо плоско в корне, либо во вложенный
        // объект `msg` (см. `emitTo(...)` в utils/ws.ts). Поддерживаем оба варианта.
        const payloadRaw: WsMessage = typeof msg === 'string' ? {} : msg;
        const nested = (
          payloadRaw.msg && typeof payloadRaw.msg === 'object'
            ? (payloadRaw.msg as WsMessage)
            : null
        ) as WsMessage | null;
        const payload: WsMessage = { ...payloadRaw, ...(nested ?? {}) };

        // COMMENT_CREATE — новое сообщение в чате. Инвалидируем тег
        // LkRequestComments[requestId] (refetch первой страницы) и саму
        // заявку (для preview last comment в RequestCard).
        if (evType === 'COMMENT_CREATE') {
          if (payload.requestId) {
            dispatch(
              lkApi.util.invalidateTags([
                { type: 'LkRequestComments', id: payload.requestId },
                { type: 'LkRequest', id: payload.requestId },
                { type: 'LkRequest', id: 'LIST' },
              ]),
            );
          }
          // Toast — только если автор не я. Без текста (no-PII в payload),
          // короткое уведомление с номером заявки клиент уже не получит без
          // отдельного запроса — оставляем общий месседж.
          const myUserId = meRef.current?.user?.id;
          if (myUserId && payload.authorUserId && payload.authorUserId !== myUserId) {
            showToast('info', 'Новое сообщение в чате');
          }
          return;
        }

        // USER_TG_BIND_OK — Telegram успешно привязан этому юзеру.
        // Инвалидируем LkMe (там обновится поле telegram), показываем toast.
        if (evType === 'USER_TG_BIND_OK') {
          const myUserId = meRef.current?.user?.id;
          if (myUserId && payload.userId && payload.userId === myUserId) {
            dispatch(lkApi.util.invalidateTags(['LkMe']));
            showToast('success', 'Telegram привязан');
          }
          return;
        }

        const tagsToInvalidate: Array<{ type: 'LkRequest'; id: string }> = [
          { type: 'LkRequest', id: 'LIST' },
        ];
        if (payload.requestId) {
          tagsToInvalidate.push({ type: 'LkRequest', id: payload.requestId });
        }
        dispatch(lkApi.util.invalidateTags(tagsToInvalidate));

        if (
          evType === 'REQUEST_ASSIGNED' &&
          payload.contractorId &&
          meRef.current?.contractor?.id &&
          payload.contractorId === meRef.current.contractor.id
        ) {
          showToast('info', 'Вам назначена новая заявка');
        }
      };

      ws.onclose = (ev) => {
        socketRef.current = null;
        lkSocket.detach(ws);
        // 1008 = Policy Violation — токен не принят сервером. Не реконнектим
        // в loop'е: пользователь должен пере-залогиниться.
        if (ev.code === 1008) {
          closedManuallyRef.current = true;
          return;
        }
        if (!closedManuallyRef.current) scheduleReconnect();
      };

      ws.onerror = () => {
        // close сработает следом — реконнект пойдёт оттуда
        try {
          ws.close();
        } catch {
          /* noop */
        }
      };
    };

    const scheduleReconnect = (): void => {
      if (closedManuallyRef.current) return;
      const delay = reconnectDelayRef.current;
      reconnectTimerRef.current = window.setTimeout(() => {
        reconnectDelayRef.current = Math.min(delay * 2, RECONNECT_MAX);
        connect();
      }, delay);
    };

    connect();

    return () => {
      closedManuallyRef.current = true;
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (socketRef.current) {
        try {
          socketRef.current.close();
        } catch {
          /* noop */
        }
        lkSocket.detach(socketRef.current);
        socketRef.current = null;
      }
    };
    // me?.user?.id в deps: если userId сменится (logout → login без unmount
    // LkLayout — теоретически возможно при ре-навигации внутри SPA), пере-
    // создаём ws-сессию с актуальным токеном вместо того, чтобы оставить
    // старый сокет с устаревшими credentials.
  }, [dispatch, me?.user?.id]);
}
