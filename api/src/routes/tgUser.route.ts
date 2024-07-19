import { Router } from 'express';
import tgUserController from '../controllers/tgUser.controller';

const router = Router();

router.route('/').post(tgUserController.create).get(tgUserController.getAll);
router.route('/:tgId').get(tgUserController.findOneByTgId);
export default router;
