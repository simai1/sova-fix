import { CronJob } from 'cron';
import RepairRequest from '../models/repairRequest';
import fs from 'node:fs';
import logger from '../utils/logger';
import { format } from 'date-fns';
import { Op } from 'sequelize';

export default {
    // setDays: new CronJob('* * * * *', async () => { // every 1 min
    setDays: new CronJob('0 3 * * *', async () => {
        logger.log({
            level: 'info',
            message: `[${format(new Date(), 'dd.MM.yyyy HH:mm')}] [CRON] Start setDays`,
        });

        const requests = await RepairRequest.findAll({ where: { status: { [Op.ne]: 3 } } });
        const dateNow = new Date();
        for (const request of requests) {
            await request.update({
                daysAtWork: Math.floor((dateNow.getTime() - request.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
            });
        }

        logger.log({
            level: 'info',
            message: `[${format(new Date(), 'dd.MM.yyyy HH:mm')}] [CRON] End setDays`,
        });
    }),
    removeUselessFiles: new CronJob('0 3 * * *', async () => {
        logger.log({
            level: 'info',
            message: `[${format(new Date(), 'dd.MM.yyyy HH:mm')}] [CRON] Start removeUselessFiles`,
        });
        let uploadsFiles: string[];
        fs.readdir('./uploads', async (err, files) => {
            if (err) {
                return console.error('Unable to scan directory: ' + err);
            }
            uploadsFiles = files;
            const requests = await RepairRequest.findAll();
            requests.forEach(request => {
                request.commentAttachment
                    ? uploadsFiles.includes(request.commentAttachment)
                        ? uploadsFiles.splice(uploadsFiles.indexOf(request.commentAttachment), 1)
                        : undefined
                    : undefined;
                request.fileName
                    ? uploadsFiles.includes(request.fileName)
                        ? uploadsFiles.splice(uploadsFiles.indexOf(request.fileName), 1)
                        : undefined
                    : undefined;
                request.checkPhoto
                    ? uploadsFiles.includes(request.checkPhoto)
                        ? uploadsFiles.splice(uploadsFiles.indexOf(request.checkPhoto), 1)
                        : undefined
                    : undefined;
            });
            uploadsFiles.forEach(file => {
                fs.unlink(`./uploads/${file}`, err => {
                    if (err) {
                        console.error(`Error deleting ${file}: ${err}`);
                    } else {
                        logger.log({
                            level: 'info',
                            message: `[${format(new Date(), 'dd.MM.yyyy HH:mm')}] ${file} deleted successfully`,
                        });
                    }
                });
            });
        });

        logger.log({
            level: 'info',
            message: `[${format(new Date(), 'dd.MM.yyyy HH:mm')}] [CRON] End removeUselessFiles`,
        });
    }),
};
