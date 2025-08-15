import { Router } from 'express';
import directoryCategoryController from '../controllers/directoryCategory.controller';

const router = Router();

router
    .route('/')
    .get(directoryCategoryController.getAllDirectoryCategory)
    .post(directoryCategoryController.createDirectoryCategory);
router
    .route('/:directoryCategoryId')
    .patch(directoryCategoryController.updateDirectoryCategory)
    .delete(directoryCategoryController.deleteDirectoryCategory);
router.route('/all_builders').get(directoryCategoryController.getAllBuilders);
router.route('/all_customers').get(directoryCategoryController.getAllCustomers)

export default router;
