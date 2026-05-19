import { ChatMessage } from '@/API/rtkQuery/lk.api';

type Listener = (msg: ChatMessage) => void;

const listenersByRequest = new Map<string, Set<Listener>>();

/**
 * Подписаться на real-time сообщения чата по конкретной заявке.
 *
 * @param requestId - Идентификатор заявки, на чат которой подписываемся
 * @param listener - Колбэк, получающий новое сообщение при доставке через WS
 * @returns Функция отписки
 */
export function subscribeChatMessages(requestId: string, listener: Listener): () => void {
  let set = listenersByRequest.get(requestId);
  if (!set) {
    set = new Set();
    listenersByRequest.set(requestId, set);
  }
  set.add(listener);
  return () => {
    const cur = listenersByRequest.get(requestId);
    if (!cur) return;
    cur.delete(listener);
    if (cur.size === 0) listenersByRequest.delete(requestId);
  };
}

/**
 * Доставить новое сообщение чата всем подписчикам этой заявки.
 *
 * @remarks
 * Вызывается из WS-хука при получении `COMMENT_CREATE` с полным payload'ом сообщения.
 *
 * @param requestId - Идентификатор заявки
 * @param message - Сообщение в формате `RequestCommentDto`
 */
export function emitChatMessage(requestId: string, message: ChatMessage): void {
  const set = listenersByRequest.get(requestId);
  if (!set) return;
  set.forEach((l) => l(message));
}
