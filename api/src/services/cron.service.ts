import { CronJob } from 'cron';
import RepairRequest from '../models/repairRequest';
import fs from 'node:fs';
import logger from '../utils/logger';
import { format } from 'date-fns';
import { Op } from 'sequelize';
import Equipment from '../models/equipment';
import Nomenclature from '../models/nomenclature';
import Category from '../models/category';
import Contractor from '../models/contractor';
import ExtContractor from '../models/externalContractor';
import ObjectDir from '../models/object';
import Unit from '../models/unit';
import TgUser from '../models/tgUser';
import LegalEntity from '../models/legalEntity';
import { sendMsg, WsMsgData } from '../utils/ws';

function isDifferenceGreaterThan7Days(date2: Date) {
    try {
        const date1 = new Date();

        const differenceInMs = date1.getTime() - date2.getTime();

        const differenceInDays = differenceInMs / (1000 * 60 * 60 * 24);

        return differenceInDays < 7;
    } catch (error) {
        console.error(`Ошибка: ${error}`);
        return false;
    }
}

export default {
    // setDays: new CronJob('* * * * *', async () => { // every 1 min
    setDays: new CronJob(
        '0 3 * * *',
        async () => {
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
        },
        null,
        true,
        'Europe/Moscow'
    ),
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
    autoRequests: new CronJob(
        '0 8 * * *',
        async () => {
            logger.log({
                level: 'info',
                message: `[${format(new Date(), 'dd.MM.yyyy HH:mm')}] [CRON] Start autoRequests`,
            });

            const equipments = await Equipment.findAll({
                include: [
                    { model: Nomenclature, include: [{ model: Category }] },
                    { model: Contractor },
                    { model: ExtContractor },
                    { model: ObjectDir, include: [{ model: Unit }, { model: LegalEntity }] },
                ],
            });
            const needTO = equipments.filter(eq => isDifferenceGreaterThan7Days(eq.lastTO));
            const tgUser = await TgUser.findOne({
                where: { role: 2 },
                order: [['createdAt', 'ASC']],
            });
            for (const e of needTO) {
                try {
                    if (!(e.Contractor || e.ExtContractor)) continue;
                    const [request, created] = await RepairRequest.findOrCreate({
                        where: {
                            unitId: e.Object?.Unit?.id,
                            objectId: e.objectId,
                            problemDescription: `Провести ТО для оборудования ${e.Nomenclature?.name}, ${e.Nomenclature?.Category?.name}`,
                            urgency: 'Маршрут',
                            legalEntityId: e.Object?.LegalEntity?.id,
                            fileName: e.photo,
                            // @ts-expect-error possibly null
                            createdBy: tgUser.id,
                        },
                        defaults: {
                            unitId: e.Object?.Unit?.id,
                            objectId: e.objectId,
                            problemDescription: `Провести ТО для оборудования ${e.Nomenclature?.name}, ${e.Nomenclature?.Category?.name}`,
                            urgency: 'Маршрут',
                            legalEntityId: e.Object?.LegalEntity?.id,
                            contractorId: e.Contractor?.id,
                            extContractorId: e.ExtContractor?.id,
                            fileName: e.photo,
                            // @ts-expect-error possibly null
                            createdBy: tgUser.id,
                            isAutoCreated: true,
                            number: 0,
                        },
                    });
                    if (created)
                        logger.log({
                            level: 'info',
                            message: `[${format(new Date(), 'dd.MM.yyyy HH:mm')}] [CRON autoRequests]: ${request.number}, ${request.createdBy}] `,
                        });
                    sendMsg({
                        msg: {
                            requestId: request.id,
                            customer: request.createdBy,
                        },
                        event: 'REQUEST_CREATE',
                    } as WsMsgData);
                } catch (e) {
                    console.log(e);
                }
            }

            logger.log({
                level: 'info',
                message: `[${format(new Date(), 'dd.MM.yyyy HH:mm')}] [CRON] End autoRequests`,
            });
        },
        null,
        true,
        'Europe/Moscow'
    ),
};
