import { Router } from "express";
import settingsController from "../controllers/settings.controller";


const router = Router();

router.route('').get(settingsController.getAllSettings)
router.route('/change/:settingId').post(settingsController.changeSettings)
router.route('/:settingName').get(settingsController.getSettingByName)

export default router;
