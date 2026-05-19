type WsLike = Pick<WebSocket, 'readyState' | 'send'> & { OPEN: number };

class LkSocket {
  private ws: WsLike | null = null;
  private subscriptions = new Map<string, number>();

  attach(ws: WsLike): void {
    this.ws = ws;
  }

  detach(ws: WsLike): void {
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
    } catch {}
  }
}

export const lkSocket = new LkSocket();
