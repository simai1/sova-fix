type Listener = (requestId: string | null) => void;

const listeners = new Set<Listener>();

export function openAdminChat(requestId: string): void {
  listeners.forEach((l) => l(requestId));
}

export function closeAdminChat(): void {
  listeners.forEach((l) => l(null));
}

export function subscribeAdminChat(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
