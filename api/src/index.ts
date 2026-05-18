import * as dotenv from 'dotenv';
dotenv.config({ path: `./.env.${process.env.NODE_ENV}.local` });
import app from './app';
import dbUtils from './utils/db';

const PORT = process.env.PORT || 3000;

// Fail-fast: в проде запрещаем стартовать с дефолтными/пустыми secret'ами.
// Дефолт `secret` исторически жил в `.env.example` и риск перехода в прод
// высок. Обнаруживаем его до initDb, чтобы не дать поднять API-сервер,
// который штампует JWT с предсказуемым ключом.
const assertProdSecrets = () => {
    if (process.env.NODE_ENV !== 'production') return;
    const required: Record<string, string | undefined> = {
        JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
        JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
        COOKIE_KEY: process.env.COOKIE_KEY,
        MASTER_API_KEY: process.env.MASTER_API_KEY,
    };
    const banned = new Set(['', 'secret', '__CHANGE_ME__']);
    const broken = Object.entries(required)
        .filter(([, v]) => !v || banned.has(v))
        .map(([k]) => k);
    if (broken.length > 0) {
        // eslint-disable-next-line no-console
        console.error(
            `[FATAL] В production обнаружены небезопасные/пустые секреты: ${broken.join(', ')}. ` +
                'Сгенерируйте уникальные значения (`openssl rand -hex 64`).'
        );
        process.exit(1);
    }
};
assertProdSecrets();

(async function initDb() {
    try {
        await dbUtils.initializeDbModels();
    } catch (e) {
        console.log(e);
        console.log('COULD NOT CONNECT TO THE DB, retrying in 5 seconds');
        setTimeout(initDb, 5000);
    }
})();

console.log(`Node env: ${process.env.NODE_ENV}`);
app.listen(PORT, () => console.log(`Listen on :${PORT}`));
