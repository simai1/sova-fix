import { NextFunction, Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';
import ApiKey from '../models/apiKey';

const verifyMasterApiKey = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const masterApiKey = req.headers['master-api-key'];
    if (masterApiKey !== process.env.MASTER_API_KEY) {
        return next(new ApiError(httpStatus.BAD_REQUEST, 'Invalid Master Api Key'));
    }
    return next();
});

const verifyApiKey = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const key = req.headers['api-key'];
    const apiKey = await ApiKey.findOne({ where: { key } }).catch(() =>
        next(new ApiError(httpStatus.BAD_REQUEST, 'Invalid Api Key'))
    );
    if (!apiKey) {
        return next(new ApiError(httpStatus.BAD_REQUEST, 'Invalid Api Key'));
    }
    return next();
});

export default {
    verifyMaster: verifyMasterApiKey,
    verifyApiKey: verifyApiKey,
};
