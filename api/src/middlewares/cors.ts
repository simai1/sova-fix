import cors from 'cors';

export default cors({
    credentials: true,
    origin: process.env.WEB_URL,
    exposedHeaders: '*',
    allowedHeaders: ['Origin', 'Content-Type', 'Accept', 'Authorization'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
});
