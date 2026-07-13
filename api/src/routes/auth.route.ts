import { Router } from 'express';
import verifyToken from '../middlewares/verify-token';
import authController from '../controllers/auth.controller';
import { validator } from '../middlewares/validator';
import { registerPublicSchema, loginSchema } from '../validations/auth.validation';
import { loginRateLimiter, registerRateLimiter } from '../middlewares/rate-limit';
import verifyRole from '../middlewares/verify-role';
import roles from '../config/roles';

const router = Router();

router.route('/register').post(verifyToken.auth, verifyRole(roles.ADMIN), authController.registerViaEmail);
router
    .route('/register-public')
    .post(registerRateLimiter, validator(registerPublicSchema), authController.registerPublic);
router.route('/login').post(loginRateLimiter, validator(loginSchema), authController.login);
router.route('/activate/:userId').post(authController.activate);
router.route('/logout').post(verifyToken.auth, authController.logout);
router.route('/refresh').get(authController.refresh);
router.route('/registerCustomerCrm').post(authController.registerCustomerCrm);

export default router;
