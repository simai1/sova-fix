import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import ApiError from '../utils/ApiError';

// Pre-middleware UUID-валидация для маршрутов с :id (или другим параметром),
// который мы хотим проверить ДО multer'а. Это закрывает кейс «multer пишет файл
// на диск, потом validator ловит невалидный id и оставляет мусор».
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const validateUuidParam =
    (paramName: string) =>
    (req: Request, _res: Response, next: NextFunction): void => {
        const value = req.params[paramName];
        if (!value || typeof value !== 'string' || !UUID_REGEX.test(value)) {
            return next(new ApiError(httpStatus.BAD_REQUEST, 'Некорректный идентификатор'));
        }
        return next();
    };

export default validateUuidParam;
