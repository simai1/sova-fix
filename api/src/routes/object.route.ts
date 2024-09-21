import { Router } from 'express';
import objectController from '../controllers/object.controller';

const router = Router();

router.route('/').get(objectController.getAll).post(objectController.create);
router.route('/:objectId').get(objectController.getOne).delete(objectController.destroy).patch(objectController.update);

export default router;
