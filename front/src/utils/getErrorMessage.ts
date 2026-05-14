/* eslint-disable @typescript-eslint/no-explicit-any */
// RTK Query при 413 от nginx (HTML-боди) ставит status='PARSING_ERROR' и
// прокладывает реальный код в originalStatus. Для FETCH_ERROR то же —
// originalStatus там нет, но status='FETCH_ERROR'. Считываем оба.
const httpCode = (err: any): number | null => {
  if (typeof err?.status === 'number') return err.status;
  if (typeof err?.originalStatus === 'number') return err.originalStatus;
  return null;
};

export function getErrorMessage(err: any): string {
  if (!err) return 'Неизвестная ошибка';
  if (typeof err === 'string') return err;
  if (err.data?.message) return err.data.message;
  const code = httpCode(err);
  if (code === 413)
    return 'Файл слишком большой. Уменьшите размер фото (до 10 МБ) и попробуйте снова.';
  if (err.message) return err.message;
  if (err.status === 'FETCH_ERROR' || err.status === 0) return 'Нет соединения с сервером';
  if (code === 401) return 'Сессия истекла. Войдите снова.';
  if (code === 403) return 'Недостаточно прав для этого действия';
  if (code === 404) return 'Не найдено';
  if (typeof code === 'number' && code >= 500) return 'Сервер недоступен. Попробуйте позже.';
  return 'Произошла ошибка. Попробуйте ещё раз.';
}
