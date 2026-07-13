export type UserData = {
  user: {
    id: string | number;
    role: string;
    name?: string | null;
    login?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

export const AUTH_SESSION_CHANGE_EVENT = 'sova:auth-session-change';

export function getAuthSessionSnapshot(): string | null {
  try {
    return sessionStorage.getItem('userData');
  } catch {
    return null;
  }
}

export function notifyAuthSessionChange(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(AUTH_SESSION_CHANGE_EVENT));
}

export function subscribeAuthSession(listener: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handleChange = (): void => listener();
  window.addEventListener(AUTH_SESSION_CHANGE_EVENT, handleChange);
  return () => window.removeEventListener(AUTH_SESSION_CHANGE_EVENT, handleChange);
}

export function getUserData(): UserData | null {
  try {
    const raw = sessionStorage.getItem('userData');
    if (!raw) return null;
    return JSON.parse(raw) as UserData;
  } catch {
    return null;
  }
}

export function setUserData(data: UserData): void {
  sessionStorage.setItem('userData', JSON.stringify(data));
  notifyAuthSessionChange();
}

export function clearUserData(): void {
  sessionStorage.removeItem('userData');
  notifyAuthSessionChange();
}

export function getUserRole(): string | null {
  return getUserData()?.user?.role ?? null;
}

export function migrateLegacyUserData(): void {
  try {
    const legacy = localStorage.getItem('userData');
    if (legacy && !sessionStorage.getItem('userData')) {
      sessionStorage.setItem('userData', legacy);
      notifyAuthSessionChange();
    }
    if (legacy) {
      localStorage.removeItem('userData');
    }
  } catch {}
}
