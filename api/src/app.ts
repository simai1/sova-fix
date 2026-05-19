import express from 'express';
import corsMiddleware from './middlewares/cors';
import helmet from 'helmet';
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
import equipmentRoute from './routes/equipment.route';
import categoryRoute from './routes/category.route';
import nomenclatureRoute from './routes/nomenclature.route';
import testRoute from './routes/test.route';
import urgencyRoute from './routes/urgency.route';
import statusRoute from './routes/status.route';
import passwordResetTokensRoute from './routes/passwordResetTokens.route';
import settingsRoute from './routes/settings.route';
import directoryCategory from './routes/directoryCategory.route';
import reportRoute from './routes/reports.route';
import lkRoute from './routes/lk.route';
import adminRoute from './routes/admin.route';

import logger from './utils/logger';
import winston from 'winston';
import rawRoute from './routes/raw.route';
import errorHandler from './middlewares/errorHandler';

const { app, getWss } = expressWs(express());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(corsMiddleware);
app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cookieParser());
app.use(
    cookieSession({
        maxAge: 30 * 24 * 60 * 60 * 1000,
        keys: [process.env.COOKIE_KEY as string],
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
    })
);
app.use(
    '/uploads',
    express.static('./uploads', {
        setHeaders: res => {
            res.setHeader('Content-Disposition', 'attachment');
            res.setHeader('X-Content-Type-Options', 'nosniff');
        },
    })
);
const dir = './uploads';
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
}

cronService.setDays.start();
cronService.autoRequests.start();

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
app.use('/equipments', equipmentRoute);
app.use('/categories', categoryRoute);
app.use('/nomenclatures', nomenclatureRoute);
app.use('/test', testRoute);
app.use('/raw', rawRoute);
app.use('/urgency', urgencyRoute);
app.use('/status', statusRoute);
app.use('/reset-password-tokens', passwordResetTokensRoute);
app.use('/settings', settingsRoute);
app.use('/directoryCategory', directoryCategory);
app.use('/reports', reportRoute);
app.use('/lk', lkRoute);
app.use('/admin', adminRoute);

import {
    authenticateSubprotocol,
    handleClientFrame,
    pickSubprotocol,
    registerClient,
    unregisterClient,
    AuthedWs,
} from './utils/ws';

app.ws('/', async (rawWs, req) => {
    const ws = rawWs as AuthedWs;
    const subprotocol = pickSubprotocol(req.headers['sec-websocket-protocol']);

    const pending: Buffer[] = [];
    let authed = false;
    const bufferHandler = (data: Buffer): void => {
        if (!authed) pending.push(data);
    };
    ws.on('message', bufferHandler);

    const user = await authenticateSubprotocol(subprotocol);
    if (!user) {
        ws.off('message', bufferHandler);
        try {
            ws.close(1008, 'unauthorized');
        } catch {
            return;
        }
        return;
    }

    registerClient(ws, user);
    authed = true;
    ws.off('message', bufferHandler);

    const onMessage = (data: Buffer): void => {
        void handleClientFrame(ws, data).catch(err => {
            logger.log({
                level: 'error',
                message: `[ws] handleClientFrame failed: ${(err as Error).message}`,
            });
        });
    };
    ws.on('message', onMessage);

    ws.on('close', () => {
        unregisterClient(ws);
    });

    for (const data of pending) onMessage(data);
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(
        new winston.transports.Console({
            format: winston.format.simple(),
        })
    );
}

app.use(errorHandler);

export const aWss = getWss();
export default app;
