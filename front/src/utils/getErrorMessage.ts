/* eslint-disable @typescript-eslint/no-explicit-any */
export function getErrorMessage(err: any): string {
  if (!err) return 'Неизвестная ошибка';
  if (typeof err === 'string') return err;
  if (err.data?.message) return err.data.message;
  if (err.message) return err.message;
  if (err.status === 'FETCH_ERROR' || err.status === 0) return 'Нет соединения с сервером';
  if (err.status === 401) return 'Сессия истекла. Войдите снова.';
  if (err.status === 403) return 'Недостаточно прав для этого действия';
  if (err.status === 404) return 'Не найдено';
  if (typeof err.status === 'number' && err.status >= 500)
    return 'Сервер недоступен. Попробуйте позже.';
  return 'Произошла ошибка. Попробуйте ещё раз.';
}
