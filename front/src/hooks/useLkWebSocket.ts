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
        return;
      }

      let ws: WebSocket;
      try {
        ws = new WebSocket(WS_URL, [`bearer.${token}`]);
      } catch {
        scheduleReconnect();
        return;
      }
      socketRef.current = ws;
      lkSocket.attach(ws);

      ws.onopen = () => {
        reconnectDelayRef.current = RECONNECT_INITIAL;
        lkSocket.resubscribeAll();
      };

      ws.onmessage = (ev) => {
        let msg: WsMessage | string = ev.data;
        try {
          msg = JSON.parse(ev.data) as WsMessage;
        } catch {}
        const evType = typeof msg === 'string' ? msg : (msg.type ?? msg.event ?? '');
        if (
          typeof msg === 'object' &&
          msg !== null &&
          ['subscribed', 'unsubscribed', 'error'].includes(String(msg.type ?? ''))
        ) {
          return;
        }
        if (!KNOWN_EVENTS.has(evType)) return;

        const payloadRaw: WsMessage = typeof msg === 'string' ? {} : msg;
        const nested = (
          payloadRaw.msg && typeof payloadRaw.msg === 'object'
            ? (payloadRaw.msg as WsMessage)
            : null
        ) as WsMessage | null;
        const payload: WsMessage = { ...payloadRaw, ...(nested ?? {}) };

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
          const myUserId = meRef.current?.user?.id;
          if (myUserId && payload.authorUserId && payload.authorUserId !== myUserId) {
            showToast('info', 'Новое сообщение в чате');
          }
          return;
        }

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
        if (ev.code === 1008) {
          closedManuallyRef.current = true;
          return;
        }
        if (!closedManuallyRef.current) scheduleReconnect();
      };

      ws.onerror = () => {
        try {
          ws.close();
        } catch {}
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
        } catch {}
        lkSocket.detach(socketRef.current);
        socketRef.current = null;
      }
    };
  }, [dispatch, me?.user?.id]);
}
