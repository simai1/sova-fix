import { Router } from 'express';
import tgUserController from '../controllers/tgUser.controller';
import verifyToken from '../middlewares/verify-token';

const router = Router();

// 1. Специфичные маршруты
router.route('/managers').get(tgUserController.getAllManagers);
router.route('/syncManager').post(tgUserController.syncManager);
router.route('/get/:tgUserId').get(tgUserController.getOne);

// 2. Публичные маршруты для бота Telegram (без авторизации)
router.route('/:tgUserId/objects/public').get(tgUserController.getUserObjects);

// 3. Маршруты для работы с объектами пользователя (требуют авторизацию)
router.route('/:tgUserId/objects')
    .get(verifyToken.auth, tgUserController.getUserObjects)
    .post(verifyToken.auth, tgUserController.addObjectToUser);

router.route('/:tgUserId/objects/:objectId')
    .delete(verifyToken.auth, tgUserController.removeObjectFromUser);

// 4. Общие маршруты
router.route('/').post(tgUserController.create).get(tgUserController.getAll);
router.route('/:tgId').get(tgUserController.findOneByTgId);

export default router;
