import { Router } from 'express';
import extContractorController from '../controllers/extContractor.controller';

const router = Router();

router.route('/').get(extContractorController.getAll).post(extContractorController.create);
router
    .route('/:extContractorId')
    .get(extContractorController.getOne)
    .delete(extContractorController.destroy)
    .patch(extContractorController.update);

export default router;
