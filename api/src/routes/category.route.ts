import { Router } from 'express';
import categoryController from '../controllers/category.controller';

const router = Router();

router.route('/').get(categoryController.getAll).post(categoryController.create);
router
    .route('/:categoryId')
    .get(categoryController.getOne)
    .patch(categoryController.update)
    .delete(categoryController.destroy);

export default router;
