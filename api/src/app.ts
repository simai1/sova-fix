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

import logger from './utils/logger';
import winston from 'winston';
import rawRoute from './routes/raw.route';
import errorHandler from './middlewares/errorHandler';

const { app, getWss } = expressWs(express());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(corsMiddleware);
// helmet выставляет базовый набор security-headers (X-Content-Type-Options,
// X-Frame-Options, Strict-Transport-Security и т.д.). CSP отключаем — на
// API он бессмыслен (нет HTML-ответов), а в проде может ломать /uploads
// для inline-просмотра картинок. crossOriginResourcePolicy=cross-origin
// нужен, потому что фронт живёт на отдельном origin (3002 → 3000).
app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cookieParser());
app.use(
    cookieSession({
        maxAge: 30 * 24 * 60 * 60 * 1000,
        keys: [process.env.COOKIE_KEY as string],
        // Симметрично refreshCookieOptions в auth.controller.ts: в проде
        // запрещаем отправку по http (Secure) и блокируем JS-доступ (httpOnly);
        // sameSite=Lax совместим с топ-навигацией и режет базовый CSRF.
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
    })
);
// uploader section
// Принудительный attachment-режим для /uploads: загруженный SVG/HTML/JS не
// исполнится в браузере как контент API-домена. Картинки/видео фронт
// рендерит через <img>/<video> — браузеры применяют Content-Disposition
// только к top-level навигациям, sub-resource'ы (img/video) рендерятся
// нормально. Прямой клик ссылки скачивает, не открывает.
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

// cron section
cronService.setDays.start();
cronService.autoRequests.start();
// cronService.removeUselessFiles.start();

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

// Глобальный errorHandler — должен быть последним middleware.
app.use(errorHandler);

export const aWss = getWss();
export default app;
