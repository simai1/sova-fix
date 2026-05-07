import * as dotenv from 'dotenv';
import buffer from 'buffer';

// Полифилл `Buffer.SlowBuffer` для Node ≥ 22 — см. подробнее в test/setup.ts.
// Дублируем здесь, потому что globalSetup исполняется в отдельном процессе ДО
// форка vitest-workers и должен быть автономен.
if (!(buffer as any).SlowBuffer) {
    (buffer as any).SlowBuffer = buffer.Buffer;
}

// Загружаем .env.test.local строго до import'а моделей.
dotenv.config({ path: `.env.${process.env.NODE_ENV}.local` });

const dbName = process.env.DB_NAME || '';
const nodeEnv = process.env.NODE_ENV || '';

if (nodeEnv !== 'test') {
    throw new Error(
        `[test/global-setup] Отказ: NODE_ENV должен быть "test", получено "${nodeEnv}". ` +
            'Запускайте тесты через npm test (NODE_ENV=test).'
    );
}

if (!dbName.toLowerCase().includes('test')) {
    throw new Error(
        `[test/global-setup] Отказ: DB_NAME="${dbName}" не содержит подстроку "test". ` +
            'Создайте отдельную тестовую БД (например, sova_fix_test) и пропишите её в api/.env.test.local. ' +
            'Это защита от случайного применения sync({ alter: true }) к dev/prod-БД.'
    );
}

// vitest вызывает setup() ОДИН раз перед спавном workers и teardown() после
// завершения всех файлов. Тяжёлый sync({ alter: true }) + seedInitialSettings
// делаем ровно здесь — workers подключаются к уже синхронизированной схеме
// и в своём `beforeAll` только инициализируют JS-классы моделей.
export async function setup() {
    const dbUtils = (await import('../src/utils/db')).default;
    await dbUtils.initializeDbModels();
    const { sequelize } = await import('../src/models');
    // Закрываем соединение из main-процесса — workers создадут свои пулы.
    await sequelize.close();
}

export async function teardown() {
    // Ничего не делаем: каждый worker сам закрывает свой пул в afterAll
    // (test/setup.ts). Тестовая схема намеренно остаётся между запусками,
    // чтобы следующий npm test попадал в кеш Postgres.
}
