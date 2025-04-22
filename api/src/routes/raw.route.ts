import { Router } from 'express';
import rawController from '../controllers/raw.controller';

const router = Router();

// Маршрут для получения связей между пользователем и объектами
router.route('/tgUserObjects/by-user/:tgUserId').get(rawController.getTgUserObjects);

export default router; 