// Типы для legacy axios-обёрток в API.js. Расширяй по мере надобности —
// новые декларации добавляются здесь, а не превращают API.js в .ts (миграция —
// отдельная задача). Минимум, который нужен TS-потребителям.
export const LogOut: () => Promise<unknown>;

// Singleton promise для /auth/refresh. Возвращает новый accessToken при успехе
// или null при провале. Использовать в RTK Query baseQuery (withReauth) —
// общий со внутренним axios interceptor’ом, чтобы не запускать два параллельных
// refresh’а одновременно.
export const getRefreshPromise: () => Promise<string | null>;

// Полная очистка sessionStorage от auth-данных + UX-флажка rememberMe в
// localStorage. Вызывать перед редиректом на /Authorization, когда refresh
// провалился окончательно (refresh-cookie умерла).
export const clearAuthSession: () => void;
