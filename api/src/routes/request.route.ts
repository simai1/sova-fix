import { Router } from 'express';
import requestController from '../controllers/request.controller';

const router = Router();

router.route('/').get(requestController.getAll).post(requestController.create);
router.route('/set/contractor').patch(requestController.setContractor);
router.route('/set/status').patch(requestController.setStatus);
export default router;
