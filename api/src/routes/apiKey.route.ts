import { Router } from 'express';
import apiKeyController from '../controllers/apiKey.controller';
import verifyApiKey from '../middlewares/verify-ApiKey';

const router = Router();

router.route('/register').get(verifyApiKey.verifyMaster, apiKeyController.registerApiKey);

export default router;
