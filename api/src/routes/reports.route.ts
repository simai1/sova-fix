import { Router } from "express";
import reportsController from "../controllers/reports.controller";


const router = Router()

router.route("/").post(reportsController.getTableReportData)

export default router