import { Router } from 'express';
import contractorController from '../controllers/contractor.controller';

const router = Router();

router.route('/').get(contractorController.getAll).post(contractorController.create);
router.route('/:contractorId/requests').get(contractorController.getContractorsRequests);
router.route('/:contractorId/itinerary').get(contractorController.getContractorsItinerary);
router.route('/:contractorId/:unitId/:objectId?').get(contractorController.getContractorsActualRequests);
router.route('/getAllContractorsAndManagers').get(contractorController.getAllContractorsAndManagers)
export default router;
