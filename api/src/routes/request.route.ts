import { Router } from 'express';
import requestController from '../controllers/request.controller';

const router = Router();

router.route('/').get(requestController.getAll).post(requestController.create);
export default router;
