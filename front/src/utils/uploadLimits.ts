// Зеркалит multer-limit `fileSize` в `api/src/routes/lk.route.ts`.
// Используется фронтом, чтобы не слать заведомо-большие файлы — иначе nginx
// тенанта (`client_max_body_size`) или multer ответят 413/400 без понятного
// текста, а юзер увидит generic-ошибку.
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export const formatBytesMB = (bytes: number): string => `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
