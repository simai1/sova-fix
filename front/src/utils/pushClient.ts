// Низкоуровневая обёртка над Web Push API. Все взаимодействия с
// navigator.serviceWorker / pushManager идут через эти функции —
// это упрощает мок в тестах и держит логику hook'а чистой.

const SW_URL = '/sw.js';
const SW_SCOPE = '/';

export const isPushSupported = (): boolean => {
  if (typeof window === 'undefined') return false;
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
};

export const getPushPermission = (): NotificationPermission => {
  if (typeof Notification === 'undefined') return 'denied';
  return Notification.permission;
};

export const ensureServiceWorkerRegistered = async (): Promise<ServiceWorkerRegistration> => {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service Worker не поддерживается');
  }
  // Если SW уже зарегистрирован под нашим scope — переиспользуем его.
  // navigator.serviceWorker.getRegistration возвращает существующую запись,
  // если она активна; иначе регистрируем новую.
  const existing = await navigator.serviceWorker.getRegistration(SW_SCOPE);
  if (existing) {
    // ready гарантирует, что SW активирован (а не только установлен).
    await navigator.serviceWorker.ready;
    return existing;
  }
  const registration = await navigator.serviceWorker.register(SW_URL, { scope: SW_SCOPE });
  await navigator.serviceWorker.ready;
  return registration;
};

// Преобразование base64url-строки VAPID-ключа в Uint8Array, как требует
// pushManager.subscribe. См. https://developer.mozilla.org/docs/Web/API/PushManager/subscribe
export const urlBase64ToUint8Array = (base64: string): Uint8Array => {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(normalized);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    output[i] = rawData.charCodeAt(i);
  }
  return output;
};

export const subscribePush = async (vapidPublicKey: string): Promise<PushSubscriptionJSON> => {
  const registration = await ensureServiceWorkerRegistered();
  const existing = await registration.pushManager.getSubscription();
  if (existing) {
    // Уже есть подписка — возвращаем её JSON, не делаем повторный subscribe
    // (push-сервис вернёт ту же подписку, но лишний раунд-трип ни к чему).
    return existing.toJSON();
  }
  // applicationServerKey ожидает BufferSource. В современных TS-lib.dom типы
  // Uint8Array<ArrayBufferLike> не присваиваются BufferSource напрямую (узкий
  // ArrayBuffer-вариант не совпадает с union'ом ArrayBufferLike) —
  // передаём именно .buffer, что соответствует контракту PushManager.
  const keyBuffer = urlBase64ToUint8Array(vapidPublicKey).buffer as ArrayBuffer;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: keyBuffer,
  });
  return subscription.toJSON();
};

export const getCurrentSubscription = async (): Promise<PushSubscription | null> => {
  if (!isPushSupported()) return null;
  const registration = await navigator.serviceWorker.getRegistration(SW_SCOPE);
  if (!registration) return null;
  return registration.pushManager.getSubscription();
};

export const unsubscribePush = async (): Promise<{ endpoint: string | null }> => {
  const subscription = await getCurrentSubscription();
  if (!subscription) return { endpoint: null };
  const endpoint = subscription.endpoint;
  try {
    await subscription.unsubscribe();
  } catch {
    // unsubscribe может упасть, если push-сервис уже забыл подписку —
    // не блокируем удаление на бэкенде.
  }
  return { endpoint };
};
