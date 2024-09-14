import { Router } from 'express';
import tgUserController from '../controllers/tgUser.controller';

const router = Router();

router.route('/').post(tgUserController.create).get(tgUserController.getAll);
router.route('/managers').get(tgUserController.getAllManagers);
router.route('/:tgId').get(tgUserController.findOneByTgId);
router.route('/syncManager').post(tgUserController.syncManager);

export default router;
