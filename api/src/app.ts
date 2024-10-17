import express from 'express';
import corsMiddleware from './middlewares/cors';
import cookieParser from 'cookie-parser';
import cookieSession from 'cookie-session';
import * as fs from 'fs';
import cronService from './services/cron.service';
import expressWs from 'express-ws';

import authRoute from './routes/auth.route';
import userRoute from './routes/user.route';
import requestRoute from './routes/request.route';
import contractorRoute from './routes/contractor.route';
import tgUserRoute from './routes/tgUser.route';
import apiKeyRoute from './routes/apiKey.route';
import objectRoute from './routes/object.route';
import unitRoute from './routes/unit.route';
import legalEntityRoute from './routes/legalEntity.route';
import extContractorRoute from './routes/extContractor.route';
import logger from './utils/logger';
import winston from 'winston';

const { app, getWss } = expressWs(express());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(corsMiddleware);
app.use(cookieParser());
app.use(
    cookieSession({
        maxAge: 30 * 24 * 60 * 60 * 1000,
        keys: [process.env.COOKIE_KEY as string],
    })
);
// uploader section
app.use('/uploads', express.static('./uploads'));
const dir = './uploads';
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
}

// cron section
cronService.setDays.start();

// routes section
app.use('/auth', authRoute);
app.use('/users', userRoute);
app.use('/requests', requestRoute);
app.use('/contractors', contractorRoute);
app.use('/tgUsers', tgUserRoute);
app.use('/apiKey', apiKeyRoute);
app.use('/objects', objectRoute);
app.use('/units', unitRoute);
app.use('/legalEntities', legalEntityRoute);
app.use('/extContractors', extContractorRoute);

// websocket section
app.ws('/', () => {
    console.log('Success');
});

// logger section
if (process.env.NODE_ENV !== 'production') {
    logger.add(
        new winston.transports.Console({
            format: winston.format.simple(),
        })
    );
}

// export const broadcastConnection = (ws: any, msg: any) => {
//     aWss.clients.forEach(client => {
//         if (client.readyState === WebSocket.OPEN) {
//             client.send(msg);
//         }
//     });
// };
export const aWss = getWss();
export default app;
