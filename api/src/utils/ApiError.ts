class ApiError extends Error {
    statusCode: number;
    isOperational: boolean;

    constructor(statusCode: number, message: string | undefined, isOperational = true, stack = '') {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        // Логирование вынесено в `middlewares/errorHandler.ts`:
        // - у него есть доступ к req (userId, login, role, method, path),
        // - он один для всех типов ошибок (ApiError, Multer, Joi, прочие),
        // - один источник = одна запись в SystemLog (раньше ApiError писал
        //   без meta, errorHandler — с meta, выходило по две строки).
        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export default ApiError;
