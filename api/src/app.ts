import express, { Express } from 'express';
import corsMiddleware from './middlewares/cors';
import cookieParser from 'cookie-parser';

import authRoute from './routes/auth.route';
import userRoute from './routes/user.route';

const app: Express = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(corsMiddleware);
app.use(cookieParser());

// routes section
app.use('/auth', authRoute);
app.use('/user', userRoute);
export default app;
