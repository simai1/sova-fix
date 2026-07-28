import express from 'express';
import expressWs from 'express-ws';

// Отдельный модуль-лист: создаёт express-приложение с поддержкой ws и отдаёт
// сервер WebSocket. Вынесен из app.ts, чтобы utils/ws.ts мог получить `aWss`,
// не импортируя app.ts (иначе возникает цикл app -> routes -> middlewares ->
// utils/jwt -> services -> utils/ws -> app).
const { app, getWss } = expressWs(express());

export const aWss = getWss();
export default app;
