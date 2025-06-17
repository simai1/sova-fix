import { Router } from "express";
import statusController from "../controllers/status.controller";

const router = Router()

router.route('/').post(statusController.createNewStatus).get(statusController.getAllStatuses)
router.route('/:statusId').patch(statusController.updateStatus).delete(statusController.destroyStatus)
router.route('/:statusNumber').get(statusController.getStatusByNumber)

export default router;