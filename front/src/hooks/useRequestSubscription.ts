import { useEffect } from 'react';

import { lkSocket } from '@/utils/lkSocket';

export function useRequestSubscription(requestId: string | undefined | null): void {
  useEffect(() => {
    if (!requestId) return;
    lkSocket.subscribe(requestId);
    return () => {
      lkSocket.unsubscribe(requestId);
    };
  }, [requestId]);
}
