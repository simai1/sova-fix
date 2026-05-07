import { useCallback, useEffect, useRef, useState } from 'react';

import {
  useLazyGetVapidPublicKeyQuery,
  useSendTestPushMutation,
  useSubscribePushMutation,
  useUnsubscribePushMutation,
} from '@/API/rtkQuery/lkPush.api';
import { getErrorMessage } from '@/utils/getErrorMessage';
import {
  ensureServiceWorkerRegistered,
  getCurrentSubscription,
  getPushPermission,
  isPushSupported,
  subscribePush,
  unsubscribePush,
} from '@/utils/pushClient';

export type PushState =
  | 'unsupported'
  | 'denied'
  | 'granted-not-subscribed'
  | 'subscribed'
  | 'loading'
  | 'unavailable';

export type UsePushSubscriptionResult = {
  state: PushState;
  enable: () => Promise<void>;
  disable: () => Promise<void>;
  sendTest: () => Promise<void>;
  error: string | null;
};

// 503 от backend = VAPID не сконфигурирован → показываем 'unavailable',
// чтобы UI отдельно от 'denied' разводил «нет инфраструктуры» и
// «юзер запретил».
const isUnavailableError = (err: unknown): boolean => {
  if (!err || typeof err !== 'object') return false;
  const status = (err as { status?: unknown }).status;
  return status === 503;
};

export const usePushSubscription = (): UsePushSubscriptionResult => {
  const [state, setState] = useState<PushState>('loading');
  const [error, setError] = useState<string | null>(null);
  // Защита от setState после unmount — флоу async, юзер может уйти со страницы.
  const mountedRef = useRef(true);

  const [triggerVapid] = useLazyGetVapidPublicKeyQuery();
  const [subscribeMutation] = useSubscribePushMutation();
  const [unsubscribeMutation] = useUnsubscribePushMutation();
  const [sendTestMutation] = useSendTestPushMutation();

  const safeSet = useCallback((next: PushState, err: string | null = null) => {
    if (!mountedRef.current) return;
    setState(next);
    setError(err);
  }, []);

  // Чисто-локальное определение состояния на mount: смотрим permission +
  // существующую подписку. Без побочной регистрации SW — её делаем только
  // при enable(). Это важно: иначе SW бы регистрировался у всех юзеров,
  // даже у тех, кто никогда не нажмёт «Включить».
  useEffect(() => {
    mountedRef.current = true;
    let cancelled = false;

    (async () => {
      if (!isPushSupported()) {
        if (!cancelled) safeSet('unsupported');
        return;
      }
      const permission = getPushPermission();
      if (permission === 'denied') {
        if (!cancelled) safeSet('denied');
        return;
      }
      try {
        const subscription = await getCurrentSubscription();
        if (cancelled) return;
        if (subscription) {
          safeSet('subscribed');
        } else if (permission === 'granted') {
          safeSet('granted-not-subscribed');
        } else {
          // permission === 'default' — юзер ещё не отвечал; считаем
          // как «не подписан, нужно нажать включить». Сам запрос
          // permission делаем уже в enable().
          safeSet('granted-not-subscribed');
        }
      } catch (err) {
        if (!cancelled) safeSet('granted-not-subscribed', getErrorMessage(err));
      }
    })();

    return () => {
      cancelled = true;
      mountedRef.current = false;
    };
  }, [safeSet]);

  const enable = useCallback(async (): Promise<void> => {
    if (!isPushSupported()) {
      safeSet('unsupported');
      return;
    }
    safeSet('loading');
    try {
      await ensureServiceWorkerRegistered();

      const permission = await Notification.requestPermission();
      if (permission === 'denied') {
        safeSet('denied');
        return;
      }
      if (permission !== 'granted') {
        // 'default' — юзер закрыл нативный prompt без выбора;
        // не считаем это ошибкой, просто возвращаем в исходное.
        safeSet('granted-not-subscribed');
        return;
      }

      const vapidResult = await triggerVapid()
        .unwrap()
        .catch((err: unknown) => {
          if (isUnavailableError(err)) {
            safeSet('unavailable');
            return null;
          }
          throw err;
        });
      if (!vapidResult) return;

      const subscriptionJson = await subscribePush(vapidResult.publicKey);

      await subscribeMutation({
        ...subscriptionJson,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      }).unwrap();

      safeSet('subscribed');
    } catch (err) {
      if (isUnavailableError(err)) {
        safeSet('unavailable');
        return;
      }
      safeSet('granted-not-subscribed', getErrorMessage(err));
    }
  }, [safeSet, subscribeMutation, triggerVapid]);

  const disable = useCallback(async (): Promise<void> => {
    if (!isPushSupported()) {
      safeSet('unsupported');
      return;
    }
    safeSet('loading');
    try {
      const { endpoint } = await unsubscribePush();
      if (endpoint) {
        // Идемпотентно: если бэкенд уже не знает endpoint — он вернёт
        // 404/204 (см. design-doc §8.1.6). Ошибки backend здесь
        // не блокируют успешную browser-side отписку.
        await unsubscribeMutation({ endpoint })
          .unwrap()
          .catch(() => undefined);
      }
      safeSet('granted-not-subscribed');
    } catch (err) {
      safeSet('subscribed', getErrorMessage(err));
    }
  }, [safeSet, unsubscribeMutation]);

  const sendTest = useCallback(async (): Promise<void> => {
    try {
      await sendTestMutation().unwrap();
      if (mountedRef.current) setError(null);
    } catch (err) {
      if (mountedRef.current) setError(getErrorMessage(err));
    }
  }, [sendTestMutation]);

  return { state, enable, disable, sendTest, error };
};

export default usePushSubscription;
