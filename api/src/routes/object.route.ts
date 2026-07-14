import { Router } from 'express';
import objectController from '../controllers/object.controller';
import { validator } from '../middlewares/validator';
import { getObjectsQuerySchema } from '../validations/object.validation';
import { authenticateWebOrMaster, requireActorRoles } from '../middlewares/authenticate-actor';
import { attachRequestScope } from '../middlewares/require-admin-request-access';
import roles from '../config/roles';

const router = Router();

router.use(authenticateWebOrMaster);

router
    .route('/')
    .get(validator(getObjectsQuerySchema), attachRequestScope, objectController.getAll)
    .post(requireActorRoles(roles.ADMIN, roles.MANAGER), objectController.create);
router
    .route('/:objectId')
    .get(requireActorRoles(roles.ADMIN, roles.MANAGER, roles.OBSERVER), objectController.getOne)
    .delete(requireActorRoles(roles.ADMIN, roles.MANAGER), objectController.destroy)
    .patch(requireActorRoles(roles.ADMIN, roles.MANAGER), objectController.update);

export default router;
