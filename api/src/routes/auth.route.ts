import { Router } from 'express';
import verifyToken from '../middlewares/verify-token';
import authController from '../controllers/auth.controller';

const router = Router();

router.route('/register').post(authController.registerViaEmail);
router.route('/login').post(authController.login);
router.route('/activate/:userId').post(authController.activate);
router.route('/logout').post(verifyToken.auth, authController.logout);
router.route('/refresh').get(authController.refresh);
router.route('/registerCustomerCrm').post(authController.registerCustomerCrm)

export default router;
