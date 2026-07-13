import { Router } from 'express';
import reportsController from '../controllers/reports.controller';
import { authenticateWebOrMaster, requireActorRoles } from '../middlewares/authenticate-actor';
import { attachRequestScope } from '../middlewares/require-admin-request-access';
import roles from '../config/roles';

const router = Router();

router.use(authenticateWebOrMaster, requireActorRoles(roles.ADMIN, roles.MANAGER, roles.OBSERVER), attachRequestScope);
router.route('/').post(reportsController.getTableReportData);

export default router;
