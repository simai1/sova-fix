import { Router } from 'express';
import objectController from '../controllers/object.controller';
import { validator } from '../middlewares/validator';
import { getObjectsQuerySchema } from '../validations/object.validation';

const router = Router();

router.route('/').get(validator(getObjectsQuerySchema), objectController.getAll).post(objectController.create);
router.route('/:objectId').get(objectController.getOne).delete(objectController.destroy).patch(objectController.update);

export default router;
