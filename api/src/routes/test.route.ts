import cronService from '../services/cron.service';
import { Router } from 'express';
import catchAsync from '../utils/catchAsync';

const router = Router();

router.route('/').get(
    catchAsync(async (req, res) => {
        cronService.autoRequests.fireOnTick();
        res.json({ status: 'ok' });
    })
);

export default router;
