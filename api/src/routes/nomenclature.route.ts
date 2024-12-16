import { Router } from 'express';
import nomenclatureController from '../controllers/nomenclature.controller';

const router = Router();

router.route('/').get(nomenclatureController.getAll).post(nomenclatureController.create);
router
    .route('/:nomenclatureId')
    .get(nomenclatureController.getOne)
    .patch(nomenclatureController.update)
    .delete(nomenclatureController.destroy);

export default router;
