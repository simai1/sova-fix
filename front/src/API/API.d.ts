export const LogOut: () => Promise<unknown>;

export const getRefreshPromise: () => Promise<string | null>;

export const clearAuthSession: () => void;
