import { Request } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import logger from '../utils/logger';

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

export const cleanupUploadedFiles = (req: Request): void => {
    const files = collectFiles(req);
    for (const file of files) {
        if (!file?.path) continue;
        if (!isInsideUploads(file.path)) continue;
        fs.promises.unlink(file.path).catch(err => {
            if (err && err.code !== 'ENOENT') {
                logger.warn(`[cleanupUploadedFiles] не удалось удалить ${file.path}: ${err.message}`);
            }
        });
    }
};

export default cleanupUploadedFiles;
