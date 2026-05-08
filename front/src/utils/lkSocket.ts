// Singleton-фасад вокруг ws-сокета ЛК, нужный экранам RequestChat/RequestDetail
// для адресной подписки на события заявки.
//
// Архитектура:
//   useLkWebSocket (LkLayout) создаёт WebSocket и вызывает lkSocket.attach(ws).
//   Экран чата вызывает lkSocket.subscribe(requestId) при mount,
//   lkSocket.unsubscribe(requestId) при unmount.
//   После reconnect useLkWebSocket вызывает resubscribeAll() — мы повторно
//   шлём subscribe-фреймы для всех активных requestId.
//
// Без подписки сервер не пришлёт STATUS_UPDATE / COMMENT_CREATE / URGENCY_UPDATE,
// даже зная requestId — это и есть точка обрезания утечки PII в WS-канал.

type WsLike = Pick<WebSocket, 'readyState' | 'send'> & { OPEN: number };

class LkSocket {
  private ws: WsLike | null = null;
  // Reference-counted set: один и тот же requestId может быть подписан из
  // нескольких компонентов (RequestDetail + ChatStream живут одновременно
  // на одном экране). Считаем количество подписчиков, отписываемся когда счётчик 0.
  private subscriptions = new Map<string, number>();

  attach(ws: WsLike): void {
    this.ws = ws;
  }

  detach(ws: WsLike): void {
    // Сохраняем подписки между reconnect — после нового attach() и onopen
    // resubscribeAll отправит их снова. Если detach происходит из-за close
    // навсегда (logout), вызывающий должен сам вызвать reset().
    if (this.ws === ws) {
      this.ws = null;
    }
  }

  reset(): void {
    this.ws = null;
    this.subscriptions.clear();
  }

  subscribe(requestId: string): void {
    if (!requestId) return;
    const next = (this.subscriptions.get(requestId) ?? 0) + 1;
    this.subscriptions.set(requestId, next);
    // Отправляем фрейм только при первом подписчике на этот requestId —
    // сервер ведёт boolean Set, повторные subscribe всё равно идемпотентны,
    // но не нагружаем канал.
    if (next === 1) {
      this.sendFrame({ type: 'subscribe', requestId });
    }
  }

  unsubscribe(requestId: string): void {
    if (!requestId) return;
    const cur = this.subscriptions.get(requestId) ?? 0;
    if (cur <= 1) {
      this.subscriptions.delete(requestId);
      this.sendFrame({ type: 'unsubscribe', requestId });
    } else {
      this.subscriptions.set(requestId, cur - 1);
    }
  }

  resubscribeAll(): void {
    for (const requestId of this.subscriptions.keys()) {
      this.sendFrame({ type: 'subscribe', requestId });
    }
  }

  private sendFrame(frame: { type: string; requestId: string }): void {
    if (!this.ws) return;
    if (this.ws.readyState !== this.ws.OPEN) return;
    try {
      this.ws.send(JSON.stringify(frame));
    } catch {
      // ignore — onclose реконнект разберётся
    }
  }
}

export const lkSocket = new LkSocket();
