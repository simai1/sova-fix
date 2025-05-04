import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';

export const validator = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const { error } = schema.validate({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      if (error) {
        const errorMessage = error.details.map((detail) => detail.message).join(', ');
        return next(new ApiError(httpStatus.BAD_REQUEST, errorMessage));
      }

      return next();
    } catch (err) {
      return next(new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Ошибка валидации'));
    }
  };
}; 