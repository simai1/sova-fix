import { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import Joi from 'joi';
import httpStatus from 'http-status';
import ApiError from '../utils/ApiError';
import logger from '../utils/logger';
import cleanupUploadedFiles from './cleanup-uploads';

const friendlyByStatus = (statusCode: number, message: string): string => {
    if (statusCode === httpStatus.UNAUTHORIZED) {
        return 'Пользователь не авторизован: нет валидного refresh-токена в cookie или он просрочен.';
    }
    if (statusCode === httpStatus.FORBIDDEN) {
        return 'Доступ запрещён: роль пользователя не позволяет выполнить операцию.';
    }
    if (statusCode === httpStatus.NOT_FOUND) {
        return 'Запрошенный ресурс не найден.';
    }
    if (statusCode === httpStatus.BAD_REQUEST) {
        return `Невалидный запрос: ${message}`;
    }
    if (statusCode === httpStatus.REQUEST_ENTITY_TOO_LARGE) {
        return 'Превышен лимит размера загружаемого файла.';
    }
    if (statusCode >= 500) {
        return 'Внутренняя ошибка сервиса. Проверьте параметры запроса и доступность БД.';
    }
    return message;
};

const friendlyForServerError = (err: any): string | null => {
    const msg = String(err?.message || '');
    if (/invalid input syntax for type uuid: "undefined"/i.test(msg)) {
        return 'Запрос содержит userId="undefined" — фронт передал в URL пустое значение. Обновите страницу/перелогиньтесь.';
    }
    if (/WHERE parameter ".*" has invalid "undefined" value/i.test(msg)) {
        return 'Запрос пришёл без обязательной cookie/токена. Перелогиньтесь.';
    }
    if (/SequelizeUniqueConstraintError/i.test(msg)) {
        return 'Нарушено условие уникальности: запись с такими полями уже существует.';
    }
    if (/SequelizeForeignKeyConstraintError/i.test(msg)) {
        return 'Нельзя выполнить операцию: есть связанные записи (FK constraint).';
    }
    return null;
};

type SequelizeMapped = { statusCode: number; clientMessage: string };

const mapSequelizeError = (err: any): SequelizeMapped | null => {
    const name: string = err?.name || '';
    if (!name.startsWith('Sequelize')) return null;

    const pgCode: string | undefined = err?.original?.code ?? err?.parent?.code;

    if (pgCode === '22001') {
        return {
            statusCode: httpStatus.BAD_REQUEST,
            clientMessage: 'Одно из полей слишком длинное. Сократите текст и попробуйте снова.',
        };
    }

    if (name === 'SequelizeValidationError') {
        return {
            statusCode: httpStatus.BAD_REQUEST,
            clientMessage: err?.errors?.[0]?.message || 'Данные не прошли проверку.',
        };
    }

    if (name === 'SequelizeUniqueConstraintError') {
        return {
            statusCode: httpStatus.CONFLICT,
            clientMessage: 'Запись с такими данными уже существует.',
        };
    }

    if (name === 'SequelizeForeignKeyConstraintError') {
        return {
            statusCode: httpStatus.BAD_REQUEST,
            clientMessage: 'Операция нарушает связь с другой записью.',
        };
    }

    return null;
};

const buildMeta = (req: Request, err: any, statusCode: number, friendly: string) => {
    const u: any = (req as any).user;
    return {
        userId: u?.id ?? null,
        login: u?.login ?? null,
        role: u?.role ?? null,
        method: req.method,
        path: req.originalUrl || req.url,
        statusCode,
        friendly,
    };
};

const errorHandler = (err: any, req: Request, res: Response, _next: NextFunction) => {
    cleanupUploadedFiles(req);

    if (res.headersSent) {
        return _next(err);
    }

    let statusCode: number = httpStatus.INTERNAL_SERVER_ERROR;
    let clientMessage = 'Внутренняя ошибка сервера. Попробуйте позже.';
    let logMessage = err?.stack || err?.message || String(err);

    if (err instanceof ApiError) {
        statusCode = err.statusCode;
        clientMessage = err.message;
        logMessage = err.message;
    } else if (err instanceof multer.MulterError) {
        statusCode = httpStatus.BAD_REQUEST;
        if (err.code === 'LIMIT_FILE_SIZE') {
            statusCode = httpStatus.REQUEST_ENTITY_TOO_LARGE;
            clientMessage = 'Файл слишком большой. Максимальный размер — 10 МБ.';
        } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            clientMessage = 'Превышен лимит файлов или неверное имя поля.';
        } else {
            clientMessage = err.message;
        }
        logMessage = `[multer:${err.code}] ${err.message}`;
    } else if (err instanceof Joi.ValidationError) {
        statusCode = httpStatus.BAD_REQUEST;
        clientMessage = err.details?.[0]?.message || 'Ошибка валидации';
        logMessage = `[joi] ${clientMessage}`;
    } else if (err && typeof err.message === 'string' && /Допустимы только/.test(err.message)) {
        statusCode = httpStatus.BAD_REQUEST;
        clientMessage = err.message;
        logMessage = err.message;
    } else {
        const sequelizeMapped = mapSequelizeError(err);
        if (sequelizeMapped) {
            statusCode = sequelizeMapped.statusCode;
            clientMessage = sequelizeMapped.clientMessage;
            logMessage = `[sequelize:${err?.name}] ${err?.parent?.message || err?.message}`;
        }
    }

    const level = statusCode >= 500 ? 'error' : 'warn';
    const friendlyServer = level === 'error' ? friendlyForServerError(err) : null;
    const friendly = friendlyServer ?? friendlyByStatus(statusCode, clientMessage);
    const meta = buildMeta(req, err, statusCode, friendly);

    logger.log({ level, message: logMessage, ...meta });

    const body: { message: string; error?: string } = { message: clientMessage };
    if (statusCode >= 500 && process.env.NODE_ENV === 'development' && err?.stack) {
        body.error = err.stack;
    }
    return res.status(statusCode).json(body);
};

export default errorHandler;
