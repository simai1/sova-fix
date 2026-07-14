import { Router } from 'express';
import verifyToken from '../middlewares/verify-token';
import userController from '../controllers/user.controller';
import verifyRole from '../middlewares/verify-role';
import roles from '../config/roles';
import { validator } from '../middlewares/validator';
import { userObjectsBodySchema } from '../validations/lk.validation';
import verifyAnyRole from '../middlewares/verify-any-role';

const router = Router();

router.route('/setRole').post(verifyToken.auth, verifyAnyRole(['ADMIN']), userController.setRole);
router.route('/').get(verifyToken.auth, userController.getAll);
router
    .route('/pending-registrations')
    .get(verifyToken.auth, verifyAnyRole(['ADMIN', 'MANAGER']), userController.getPendingRegistrations);
router
    .route('/:userId/approve')
    .patch(verifyToken.auth, verifyAnyRole(['ADMIN', 'MANAGER']), userController.approveUser);
router
    .route('/:userId/objects')
    .get(verifyToken.auth, verifyAnyRole(['ADMIN', 'MANAGER']), userController.getUserObjects)
    .put(
        verifyToken.auth,
        verifyAnyRole(['ADMIN', 'MANAGER']),
        validator(userObjectsBodySchema),
        userController.setUserObjects
    );
router
    .route('/confirm/:userId')
    .patch(verifyToken.auth, verifyAnyRole(['ADMIN', 'MANAGER']), userController.confirmTgUser);
router.route('/:userId').delete(verifyToken.auth, verifyRole(roles.ADMIN), userController.destroy);
router.route('/:tgId').get(userController.getUserByTgId);

export default router;
