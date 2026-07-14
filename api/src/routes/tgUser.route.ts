import { Router } from 'express';
import tgUserController from '../controllers/tgUser.controller';
import verifyToken from '../middlewares/verify-token';
import verifyApiKey from '../middlewares/verify-ApiKey';
import { authenticateWebOrMaster, requireBotActor } from '../middlewares/authenticate-actor';

const router = Router();

router.route('/managers').get(tgUserController.getAllManagers);
router.route('/syncManager').post(tgUserController.syncManager);
router.route('/get/:tgUserId').get(tgUserController.getOne);

router.route('/bind').post(verifyApiKey.verifyMaster, tgUserController.bind);

router.route('/:tgUserId/objects/public').get(tgUserController.getUserObjects);

router
    .route('/:tgUserId/objects')
    .get(verifyToken.auth, tgUserController.getUserObjects)
    .post(verifyToken.auth, tgUserController.addObjectToUser);

router.route('/:tgUserId/objects/:objectId').delete(verifyToken.auth, tgUserController.removeObjectFromUser);

router.route('/').post(authenticateWebOrMaster, requireBotActor, tgUserController.create).get(tgUserController.getAll);
router.route('/:tgId').get(tgUserController.findOneByTgId);

router
    .route('/:tgUserId/manager/count')
    .get(authenticateWebOrMaster, requireBotActor, tgUserController.getManagersObjectsWithCountRequests);
router
    .route('/:tgUserId/contractor/count')
    .get(authenticateWebOrMaster, requireBotActor, tgUserController.getContractorsObjectsWithCountRequests);

export default router;
