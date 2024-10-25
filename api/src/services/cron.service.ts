import { CronJob } from 'cron';
import RepairRequest from '../models/repairRequest';
export default {
    // setDays: new CronJob('* * * * *', async () => { // every 1 min
    setDays: new CronJob('0 3 * * *', async () => {
        console.log('[CRON] Start setDays');

        const requests = await RepairRequest.findAll({ where: { status: [1, 2] } });
        for (const request of requests) {
            await request.increment('daysAtWork');
        }

        console.log('[CRON] End setDays');
    }),
};
