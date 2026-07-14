import { Router } from 'express';
import contractorController from '../controllers/contractor.controller';
import { authenticateWebOrMaster, requireActorRoles } from '../middlewares/authenticate-actor';
import { attachRequestScope } from '../middlewares/require-admin-request-access';
import roles from '../config/roles';

const router = Router();

router.use(authenticateWebOrMaster);
router.route('/').get(contractorController.getAll);
router.use(requireActorRoles(roles.ADMIN, roles.MANAGER, roles.OBSERVER), attachRequestScope);
router.route('/:contractorId/requests').get(contractorController.getContractorsRequests);
router.route('/:contractorId/itinerary').get(contractorController.getContractorsItinerary);
router.route('/:contractorId/:unitId/:objectId?').get(contractorController.getContractorsActualRequests);
export default router;
