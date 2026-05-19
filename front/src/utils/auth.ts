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

export function migrateLegacyUserData(): void {
  try {
    const legacy = localStorage.getItem('userData');
    if (legacy && !sessionStorage.getItem('userData')) {
      sessionStorage.setItem('userData', legacy);
    }
    if (legacy) {
      localStorage.removeItem('userData');
    }
  } catch {}
}
