import { Router } from 'express';
import legalEntityController from '../controllers/legalEntity.controller';

const router = Router();

router.route('/').get(legalEntityController.getAll).post(legalEntityController.create);
router
    .route('/:legalEntityId')
    .get(legalEntityController.getOne)
    .delete(legalEntityController.destroy)
    .patch(legalEntityController.update);

export default router;
