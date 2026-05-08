import { Router } from 'express';
import verifyToken from '../middlewares/verify-token';
import verifyRole from '../middlewares/verify-role';
import roles from '../config/roles';
import { validator } from '../middlewares/validator';
import { listLogsQuerySchema } from '../validations/admin.validation';
import adminController from '../controllers/admin.controller';

const router = Router();

// Все админ-роуты дополнительно крыты verifyRole(ADMIN) — auth по access-токену
// + role-чек по refresh-cookie. Тот же паттерн, что у /users/pending-registrations.
router
    .route('/logs')
    .get(verifyToken.auth, verifyRole(roles.ADMIN), validator(listLogsQuerySchema), adminController.getSystemLogs);

export default router;
