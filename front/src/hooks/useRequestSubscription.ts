import { useEffect } from 'react';

import { lkSocket } from '@/utils/lkSocket';

// Подписывает текущий ws-сокет на события заявки. Вызывается на экранах
// детали/чата заявки. На unmount/смене requestId автоматически отписывается.
//
// Сервер без подписки не пришлёт STATUS_UPDATE/COMMENT_CREATE — без этого
// hook'а live-обновления чата работать не будут (см. utils/ws.ts §audience.request).
export function useRequestSubscription(requestId: string | undefined | null): void {
  useEffect(() => {
    if (!requestId) return;
    lkSocket.subscribe(requestId);
    return () => {
      lkSocket.unsubscribe(requestId);
    };
  }, [requestId]);
}
