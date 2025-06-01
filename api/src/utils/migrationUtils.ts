import RepairRequest from '../models/repairRequest';
import TgUser from '../models/tgUser';
import logger from './logger';
import { Op } from 'sequelize';

/**
 * Миграция старых записей managerId с числовых значений на UUID
 * Эта функция должна быть запущена один раз для исправления legacy данных
 */
export const migrateManagerIds = async (): Promise<void> => {
    try {
        logger.info('Начинаем миграцию managerId...');
        
        // Находим все заявки с числовыми managerId
        const requestsWithNumericManagerId = await RepairRequest.findAll({
            where: {
                managerId: {
                    // Ищем записи где managerId не содержит дефис (не UUID)
                    [Op.not]: {
                        [Op.like]: '%-%'
                    }
                }
            }
        });
        
        logger.info(`Найдено ${requestsWithNumericManagerId.length} заявок с числовыми managerId`);
        
        for (const request of requestsWithNumericManagerId) {
            try {
                const numericManagerId = request.managerId;
                
                // Пытаемся найти TgUser по старому числовому ID
                // Это может потребовать дополнительной логики в зависимости от структуры данных
                const tgUser = await TgUser.findOne({
                    where: {
                        // Предполагаем, что старый ID может быть сохранен в каком-то поле
                        // Возможно, нужно будет адаптировать эту логику
                        id: numericManagerId
                    }
                });
                
                if (tgUser) {
                    await request.update({
                        managerId: tgUser.id,
                        managerTgId: tgUser.tgId
                    });
                    
                    logger.info(`Обновлена заявка ${request.id}: managerId ${numericManagerId} -> ${tgUser.id}, managerTgId -> ${tgUser.tgId}`);
                } else {
                    logger.warn(`Не найден TgUser для managerId ${numericManagerId} в заявке ${request.id}`);
                    
                    // Очищаем некорректный managerId
                    await request.update({
                        managerId: null,
                        managerTgId: null
                    });
                    
                    logger.info(`Очищен некорректный managerId для заявки ${request.id}`);
                }
            } catch (error) {
                logger.error(`Ошибка при обработке заявки ${request.id}: ${error}`);
            }
        }
        
        logger.info('Миграция managerId завершена');
    } catch (error) {
        logger.error(`Ошибка при миграции managerId: ${error}`);
        throw error;
    }
};

/**
 * Функция для проверки и исправления данных managerId
 * Может быть вызвана периодически для поддержания целостности данных
 */
export const validateManagerIds = async (): Promise<void> => {
    try {
        logger.info('Проверяем целостность данных managerId...');
        
        // Находим заявки с managerId, но без managerTgId
        const requestsWithoutTgId = await RepairRequest.findAll({
            where: {
                managerId: {
                    [Op.ne]: null
                },
                managerTgId: null
            },
            include: [{ model: TgUser, as: 'TgUser' }]
        });
        
        logger.info(`Найдено ${requestsWithoutTgId.length} заявок с managerId, но без managerTgId`);
        
        for (const request of requestsWithoutTgId) {
            try {
                const tgUser = await TgUser.findByPk(request.managerId);
                
                if (tgUser) {
                    await request.update({
                        managerTgId: tgUser.tgId
                    });
                    
                    logger.info(`Добавлен managerTgId ${tgUser.tgId} для заявки ${request.id}`);
                } else {
                    logger.warn(`TgUser с ID ${request.managerId} не найден для заявки ${request.id}`);
                    
                    // Очищаем некорректный managerId
                    await request.update({
                        managerId: null
                    });
                }
            } catch (error) {
                logger.error(`Ошибка при проверке заявки ${request.id}: ${error}`);
            }
        }
        
        logger.info('Проверка целостности данных managerId завершена');
    } catch (error) {
        logger.error(`Ошибка при проверке целостности данных managerId: ${error}`);
        throw error;
    }
}; 