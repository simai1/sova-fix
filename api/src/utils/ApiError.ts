import logger from './logger';
import { format } from 'date-fns';

class ApiError extends Error {
    statusCode: number;
    isOperational: boolean;

    constructor(statusCode: number, message: string | undefined, isOperational = true, stack = '') {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        logger.log({
            level: 'error',
            message: `[${format(new Date(), 'dd.MM.yyyy HH:mm')}] ${message}`,
        });
        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export default ApiError;
