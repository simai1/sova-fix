import { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import Joi from 'joi';
import httpStatus from 'http-status';
import ApiError from '../utils/ApiError';
import logger from '../utils/logger';
import cleanupUploadedFiles from './cleanup-uploads';

// Глобальный errorHandler — последний middleware. До его подключения проект
// полагался на то, что catchAsync прокидывал ошибки в next(...) без обработчика;
// это приводило к default-handler Express и текстовым 500-ответам. Здесь
// конвертируем в JSON с понятными русскими сообщениями.
const errorHandler = (err: any, req: Request, res: Response, _next: NextFunction) => {
    // Multer уже записал файлы на диск ДО валидации/auth/role-чеков. Если запрос
    // ошибочный — подчищаем, чтобы в ./uploads не копился мусор от 4xx-запросов.
    cleanupUploadedFiles(req);

    if (res.headersSent) {
        return _next(err);
    }

    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({ message: err.message });
    }

    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res
                .status(httpStatus.REQUEST_ENTITY_TOO_LARGE)
                .json({ message: 'Файл слишком большой. Максимальный размер — 10 МБ.' });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(httpStatus.BAD_REQUEST).json({ message: 'Превышен лимит файлов или неверное имя поля.' });
        }
        return res.status(httpStatus.BAD_REQUEST).json({ message: err.message });
    }

    if (err instanceof Joi.ValidationError) {
        const detail = err.details?.[0]?.message || 'Ошибка валидации';
        return res.status(httpStatus.BAD_REQUEST).json({ message: detail });
    }

    // Сообщения от multer fileFilter — обычные Error с понятным сообщением.
    if (err && typeof err.message === 'string' && /Допустимы только/.test(err.message)) {
        return res.status(httpStatus.BAD_REQUEST).json({ message: err.message });
    }

    logger.error(`[errorHandler] ${err?.stack || err?.message || String(err)}`);
    const body: { message: string; error?: string } = {
        message: 'Внутренняя ошибка сервера. Попробуйте позже.',
    };
    // Stack включаем только в явно development-окружении: иначе при отсутствующем
    // NODE_ENV (например, кривой деплой) рискуем утечь стек клиенту.
    if (process.env.NODE_ENV === 'development' && err?.stack) {
        body.error = err.stack;
    }
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json(body);
};

export default errorHandler;
