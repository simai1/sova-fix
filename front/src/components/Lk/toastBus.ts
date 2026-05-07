export type LkToastType = 'success' | 'error' | 'info';

export type LkToast = {
  id: number;
  type: LkToastType;
  message: string;
};

type Listener = (t: LkToast) => void;

const listeners = new Set<Listener>();
let counter = 0;

export function showToast(type: LkToastType, message: string): void {
  counter += 1;
  const toast: LkToast = { id: counter, type, message };
  listeners.forEach((l) => l(toast));
}

export function subscribeToasts(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
