import { Router } from 'express';
import verifyToken from '../middlewares/verify-token';
import userController from '../controllers/user.controller';
import verifyRole from '../middlewares/verify-role';
import roles from '../config/roles';
import { validator } from '../middlewares/validator';
import { userObjectsBodySchema } from '../validations/lk.validation';

const router = Router();

router.route('/setRole').post(verifyToken.auth, verifyRole(roles.ADMIN), userController.setRole);
router.route('/').get(verifyToken.auth, userController.getAll);
// КРИТИЧНО: статические сегменты (`/pending-registrations`, `/confirm/:userId`)
// и `/:userId/objects` объявлены ДО `/:tgId` и `/:userId`, иначе Express
// матчит, например, `/users/<id>/objects` как `/:tgId='<id>/objects'` и т.п.
router
    .route('/pending-registrations')
    .get(verifyToken.auth, verifyRole(roles.ADMIN), userController.getPendingRegistrations);
router.route('/:userId/approve').patch(verifyToken.auth, verifyRole(roles.ADMIN), userController.approveUser);
router
    .route('/:userId/objects')
    .get(verifyToken.auth, verifyRole(roles.ADMIN), userController.getUserObjects)
    .put(verifyToken.auth, verifyRole(roles.ADMIN), validator(userObjectsBodySchema), userController.setUserObjects);
router.route('/confirm/:userId').patch(verifyToken.auth, verifyRole(roles.ADMIN), userController.confirmTgUser);
router.route('/:userId').delete(verifyToken.auth, verifyRole(roles.ADMIN), userController.destroy);
router.route('/:tgId').get(userController.getUserByTgId);

export default router;
