import { Router } from 'express';
import verifyToken from '../middlewares/verify-token';
import userController from '../controllers/user.controller';
import verifyRole from '../middlewares/verify-role';
import roles from '../config/roles';

const router = Router();

router.route('/setRole').post(verifyToken.auth, verifyRole(roles.ADMIN), userController.setRole);
router.route('/').get(userController.getAll);
router.route('/:userId').delete(verifyToken.auth, userController.destroy);

export default router;
