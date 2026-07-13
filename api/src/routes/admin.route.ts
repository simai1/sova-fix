import { Router } from 'express';
import verifyToken from '../middlewares/verify-token';
import verifyAnyRole from '../middlewares/verify-any-role';
import { validator } from '../middlewares/validator';
import { listLogsQuerySchema } from '../validations/admin.validation';
import adminController from '../controllers/admin.controller';

const router = Router();

router
    .route('/logs')
    .get(
        verifyToken.auth,
        verifyAnyRole(['ADMIN', 'MANAGER']),
        validator(listLogsQuerySchema),
        adminController.getSystemLogs
    );

export default router;
