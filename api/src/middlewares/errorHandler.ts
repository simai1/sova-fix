import { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import Joi from 'joi';
import httpStatus from 'http-status';
import ApiError from '../utils/ApiError';
import logger from '../utils/logger';
import cleanupUploadedFiles from './cleanup-uploads';

// Глобальный errorHandler — последний middleware и единая точка логирования
// ошибок. До его подключения проект полагался на то, что catchAsync прокидывал
// ошибки в next(...) без обработчика; это приводило к default-handler Express
// и текстовым 500-ответам. Здесь конвертируем в JSON с понятными русскими
// сообщениями и пишем в SystemLog с meta-аннотациями для менеджеров:
// userId/login/role/method/path/statusCode/friendly.

// Friendly — короткое русскоязычное объяснение «что значит эта ошибка для
// менеджера». Не для разработчика — без стектрейса и SQL'я. Используется
// в админке /Directory/SystemLogs как «человеческая» подсказка рядом с
// техническим message.
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

// Маленький helper: tip-style подсказка для частых 5xx, чтобы менеджер сразу
// понимал, куда смотреть. Возвращает null, если конкретной подсказки нет —
// тогда показываем generic friendlyByStatus(500).
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

const buildMeta = (req: Request, err: any, statusCode: number, friendly: string) => {
    // req.user выставляется verifyToken.auth: { id, login, name, role, ... }.
    // Может отсутствовать, если ошибка случилась до auth-middleware (например,
    // 401 «User unauthorized» ровно потому, что токена не было) — пишем null.
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
    // Multer уже записал файлы на диск ДО валидации/auth/role-чеков. Если запрос
    // ошибочный — подчищаем, чтобы в ./uploads не копился мусор от 4xx-запросов.
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
        // Сообщения от multer fileFilter — обычные Error с понятным сообщением.
        statusCode = httpStatus.BAD_REQUEST;
        clientMessage = err.message;
        logMessage = err.message;
    }

    // Уровень: 5xx → error, 4xx → warn (предупреждения, не дефекты сервера).
    // Это даёт менеджерам в `/Directory/SystemLogs` фильтровать настоящие
    // дефекты от шумных «нет токена» / «доступ запрещён».
    const level = statusCode >= 500 ? 'error' : 'warn';
    const friendlyServer = level === 'error' ? friendlyForServerError(err) : null;
    const friendly = friendlyServer ?? friendlyByStatus(statusCode, clientMessage);
    const meta = buildMeta(req, err, statusCode, friendly);

    logger.log({ level, message: logMessage, ...meta });

    const body: { message: string; error?: string } = { message: clientMessage };
    // Stack включаем только в явно development-окружении: иначе при отсутствующем
    // NODE_ENV (например, кривой деплой) рискуем утечь стек клиенту.
    if (statusCode >= 500 && process.env.NODE_ENV === 'development' && err?.stack) {
        body.error = err.stack;
    }
    return res.status(statusCode).json(body);
};

export default errorHandler;
