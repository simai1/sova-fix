import { Router } from 'express';
import urgencyController from '../controllers/urgency.controller';

const router = Router();

router.route('/').post(urgencyController.createNewUrgency).get(urgencyController.getAllUrgencies)
router.route('/:urgencyId').patch(urgencyController.updateUrgency).delete(urgencyController.destroyUrgency)

export default router;