import { Router } from "express";
import directoryCategoryController from "../controllers/directoryCategory.controller";

const router = Router();

router.route('/').get(directoryCategoryController.getAllDirectoryCategory)

export default router;
