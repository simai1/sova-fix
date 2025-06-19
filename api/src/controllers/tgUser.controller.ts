import catchAsync from '../utils/catchAsync';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';
import roles from '../config/roles';
import tgUserService from '../services/tgUser.service';

const create = catchAsync(async (req, res) => {
    const { name, role, tgId, linkId } = req.body;
    if (!name) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing name');
    if (!role) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing role');
    if (!tgId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing tgId');
    // if (!linkId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing linkId');
    if (!Object.values(roles).includes(role) && (role == 1 || role == 2))
        throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid role');
    const user = await tgUserService.create(name, role, tgId, linkId);
    res.json(user);
});

const syncManager = catchAsync(async (req, res) => {
    const { email, password, name, tgId, linkId } = req.body;
    console.log('DEBUG BODY', email, password, name, tgId, linkId)
    if (!email) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing email');
    if (!password) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing password');
    if (!name) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing name');
    if (!tgId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing tgId');
    // if (!linkId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing linkId');
    const user = await tgUserService.syncManagerToTgUser(email, password, name, tgId, linkId);
    console.log('DEBUG USER', user)
    res.json(user);
});

const findOneByTgId = catchAsync(async (req, res) => {
    const { tgId } = req.params;
    if (!tgId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing tgId');
    const user = await tgUserService.findUserByTgId(tgId);
    res.json(user);
});

const getAll = catchAsync(async (req, res) => {
    const users = await tgUserService.getAll();
    res.json(users);
});

const getAllManagers = catchAsync(async (req, res) => {
    const users = await tgUserService.getAllManagers();
    res.json(users);
});

const getOne = catchAsync(async (req, res) => {
    const { tgUserId } = req.params;
    const user = await tgUserService.getOneUser(tgUserId);
    res.json(user);
});

const getUserObjects = catchAsync(async (req, res) => {
    const { tgUserId } = req.params;
    
    if (!tgUserId) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            error: 'Missing tgUserId',
            message: 'Отсутствует ID пользователя Telegram'
        });
    }
    
    try {
        const objects = await tgUserService.getUserObjects(tgUserId);
        
        res.json({
            success: true,
            message: 'Объекты пользователя успешно получены',
            objects
        });
    } catch (error: any) {
        
        if (error instanceof ApiError) {
            if (error.statusCode === httpStatus.NOT_FOUND) {
                return res.status(error.statusCode).json({
                    success: false,
                    error: error.name,
                    message: 'Пользователь не найден'
                });
            } else {
                return res.status(error.statusCode).json({
                    success: false,
                    error: error.name,
                    message: error.message
                });
            }
        }
        
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: error.name || 'UnknownError',
            message: `Не удалось получить объекты пользователя. ${error.message || 'Произошла непредвиденная ошибка'}`
        });
    }
});

const addObjectToUser = catchAsync(async (req, res) => {
    const { tgUserId } = req.params;
    const { objectId } = req.body;
    
    if (!tgUserId) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            error: 'Missing tgUserId',
            message: 'Отсутствует ID пользователя Telegram'
        });
    }
    
    if (!objectId) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            error: 'Missing objectId',
            message: 'Отсутствует ID объекта'
        });
    }
    
    try {
        const relation = await tgUserService.addObjectToUser(tgUserId, objectId);
        
        const objects = await tgUserService.getUserObjects(tgUserId);
        
        res.status(201).json({
            success: true,
            message: 'Объект успешно добавлен пользователю',
            relation,
            objects
        });
    } catch (error: any) {
        if (error instanceof ApiError) {
            if (error.statusCode === httpStatus.CONFLICT) {
                return res.status(error.statusCode).json({
                    success: false,
                    error: error.name,
                    message: 'Связь уже существует. Объект уже добавлен пользователю.'
                });
            } else {
                return res.status(error.statusCode).json({
                    success: false,
                    error: error.name,
                    message: error.message
                });
            }
        }
        
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: error.name || 'UnknownError',
            message: `Не удалось добавить объект пользователю. ${error.message || 'Произошла непредвиденная ошибка'}`
        });
    }
});

const removeObjectFromUser = catchAsync(async (req, res) => {
    const { tgUserId, objectId } = req.params;
    
    if (!tgUserId) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            error: 'Missing tgUserId',
            message: 'Отсутствует ID пользователя Telegram'
        });
    }
    
    if (!objectId) {
        return res.status(httpStatus.BAD_REQUEST).json({
            success: false,
            error: 'Missing objectId',
            message: 'Отсутствует ID объекта'
        });
    }
    
    try {
        await tgUserService.removeObjectFromUser(tgUserId, objectId);
        
        const objects = await tgUserService.getUserObjects(tgUserId);
        
        res.status(200).json({
            success: true,
            message: 'Объект успешно удален у пользователя',
            objects
        });
    } catch (error: any) {
        if (error instanceof ApiError) {
            if (error.statusCode === httpStatus.NOT_FOUND) {
                return res.status(error.statusCode).json({
                    success: false,
                    error: error.name,
                    message: 'Связь не найдена. Возможно, объект уже был удален у пользователя.'
                });
            } else {
                return res.status(error.statusCode).json({
                    success: false,
                    error: error.name,
                    message: error.message
                });
            }
        }
        
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: error.name || 'UnknownError',
            message: `Не удалось удалить объект у пользователя. ${error.message || 'Произошла непредвиденная ошибка'}`
        });
    }
});

export default {
    create,
    syncManager,
    findOneByTgId,
    getAll,
    getAllManagers,
    getOne,
    getUserObjects,
    addObjectToUser,
    removeObjectFromUser
};
