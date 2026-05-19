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
  const existing = await navigator.serviceWorker.getRegistration(SW_SCOPE);
  if (existing) {
    await navigator.serviceWorker.ready;
    return existing;
  }
  const registration = await navigator.serviceWorker.register(SW_URL, { scope: SW_SCOPE });
  await navigator.serviceWorker.ready;
  return registration;
};

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
    return existing.toJSON();
  }
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
  } catch {}
  return { endpoint };
};
