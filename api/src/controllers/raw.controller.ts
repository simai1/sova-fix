import catchAsync from '../utils/catchAsync';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';
import { models } from '../models';
import logger from '../utils/logger';

/**
 * Получает все связи между пользователем Telegram и объектами
 */
const getTgUserObjects = catchAsync(async (req, res) => {
    const { tgUserId } = req.params;
    
    if (!tgUserId) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Missing tgUserId');
    }
    
    try {
        logger.log({
            level: 'info',
            message: `RAW API: Getting TgUserObjects relations for user ${tgUserId}`,
        });
        
        // Получаем все связи из таблицы TgUserObject для конкретного пользователя
        const relations = await (models.TgUserObject as any).findAll({
            where: { tgUserId },
            attributes: ['id', 'tgUserId', 'objectId'],
            raw: true, // Возвращаем "сырые" данные без метаданных Sequelize
        });
        
        logger.log({
            level: 'info',
            message: `RAW API: Found ${relations.length} relations for user ${tgUserId}`,
            data: relations,
        });
        
        return res.json(relations);
    } catch (error) {
        logger.log({
            level: 'error',
            message: `RAW API: Error getting TgUserObjects for user ${tgUserId}`,
            error,
        });
        
        throw new ApiError(
            httpStatus.INTERNAL_SERVER_ERROR,
            `Failed to get relations for user ${tgUserId}`
        );
    }
});

export default {
    getTgUserObjects,
}; 