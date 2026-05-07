import { Request } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import logger from '../utils/logger';

// Удаление временных файлов, записанных multer'ом ДО валидации/auth/role-проверок.
// Если запрос обломался (401/403/404/400), на диске остаётся мусор — этот helper
// вызывается из errorHandler и подчищает всё, что multer успел записать.
//
// Безопасность: проверяем, что path указывает внутрь ./uploads — иначе игнорируем.
// Это защищает от race-condition / подделанного req.file.path (теоретический сценарий,
// если злоумышленник смог бы дотянуться до middleware-цепочки).
const UPLOADS_ROOT = path.resolve('./uploads');

const isInsideUploads = (filePath: string): boolean => {
    const abs = path.resolve(filePath);
    const rel = path.relative(UPLOADS_ROOT, abs);
    return !rel.startsWith('..') && !path.isAbsolute(rel);
};

const collectFiles = (req: Request): Express.Multer.File[] => {
    const files: Express.Multer.File[] = [];
    const single = (req as any).file as Express.Multer.File | undefined;
    if (single) files.push(single);

    const multiple = (req as any).files as
        | Express.Multer.File[]
        | { [field: string]: Express.Multer.File[] }
        | undefined;
    if (Array.isArray(multiple)) {
        files.push(...multiple);
    } else if (multiple && typeof multiple === 'object') {
        for (const arr of Object.values(multiple)) {
            if (Array.isArray(arr)) files.push(...arr);
        }
    }
    return files;
};

// Запускает асинхронное удаление файлов; ошибки удаления глотаем (best-effort cleanup,
// нельзя ломать ответ клиенту из-за race с уже удалённым файлом).
export const cleanupUploadedFiles = (req: Request): void => {
    const files = collectFiles(req);
    for (const file of files) {
        if (!file?.path) continue;
        if (!isInsideUploads(file.path)) continue;
        fs.promises.unlink(file.path).catch(err => {
            // ENOENT — файл уже удалён или не создан, не логируем как warning.
            if (err && err.code !== 'ENOENT') {
                logger.warn(`[cleanupUploadedFiles] не удалось удалить ${file.path}: ${err.message}`);
            }
        });
    }
};

export default cleanupUploadedFiles;
