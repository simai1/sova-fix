// userData хранится только в sessionStorage (XSS-surface уже, чем localStorage:
// данные исчезают при закрытии вкладки и не доступны другим вкладкам).
// Старые ветки кода ещё могут писать в localStorage — миграция в migrateLegacyUserData().

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
}

export function clearUserData(): void {
  sessionStorage.removeItem('userData');
}

export function getUserRole(): string | null {
  return getUserData()?.user?.role ?? null;
}

// One-shot миграция для пользователей со старой версией фронта,
// у которых userData ещё лежит в localStorage. Вызывается на старте App.
export function migrateLegacyUserData(): void {
  try {
    const legacy = localStorage.getItem('userData');
    if (legacy && !sessionStorage.getItem('userData')) {
      sessionStorage.setItem('userData', legacy);
    }
    if (legacy) {
      localStorage.removeItem('userData');
    }
  } catch {
    // ignore — приватный режим/квота: всё равно дальше идём через sessionStorage
  }
}
