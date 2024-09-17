import { CronJob } from 'cron';
import RepairRequest from '../models/repairRequest';
export default {
    setDays: new CronJob('00 00 * * *', async () => {
        console.log('[CRON] Start setDays');

        const requests = await RepairRequest.findAll({ where: { status: 2 } });
        const today = new Date();
        for (const request of requests) {
            const dayDiff = Math.round((today.getTime() - Number(request.createdAt)) / (1000 * 3600 * 24));
            await request.update({ daysAtWork: dayDiff });
        }

        console.log('[CRON] End setDays');
    }),
};
