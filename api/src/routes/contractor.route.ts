import { Router } from 'express';
import contractorController from '../controllers/contractor.controller';

const router = Router();

router.route('/').get(contractorController.getAll).post(contractorController.create);
export default router;
