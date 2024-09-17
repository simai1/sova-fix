import { Router } from 'express';
import unitController from '../controllers/unit.controller';

const router = Router();

router.route('/').get(unitController.getAll).post(unitController.create);
router.route('/:unitId').get(unitController.getOne).delete(unitController.destroy).patch(unitController.update);

export default router;
