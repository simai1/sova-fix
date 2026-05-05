import * as dotenv from 'dotenv';
import { beforeAll, afterAll } from 'vitest';

// Загружаем .env.test.local строго до импорта моделей/sequelize.
// ВАЖНО: ES-модули хойстят import'ы наверх, поэтому модели/sequelize грузим
// динамически в beforeAll — иначе они увидят пустой process.env.
dotenv.config({ path: `.env.${process.env.NODE_ENV}.local` });

// SAFEGUARD: setup вызывает initializeDbModels(), который делает sync({ alter: true }).
// Это может необратимо изменить схему. Поэтому до любых импортов моделей
// убеждаемся, что мы работаем именно с тестовой БД и в test-среде.
const dbName = process.env.DB_NAME || '';
const nodeEnv = process.env.NODE_ENV || '';

if (nodeEnv !== 'test') {
    throw new Error(
        `[test/setup] Отказ: NODE_ENV должен быть "test", получено "${nodeEnv}". ` +
            'Запускайте тесты через npm test (NODE_ENV=test).'
    );
}

if (!dbName.toLowerCase().includes('test')) {
    throw new Error(
        `[test/setup] Отказ: DB_NAME="${dbName}" не содержит подстроку "test". ` +
            'Создайте отдельную тестовую БД (например, sova_fix_test) и пропишите её в api/.env.test.local. ' +
            'Это защита от случайного применения sync({ alter: true }) к dev/prod-БД.'
    );
}

beforeAll(async () => {
    // Динамический import гарантирует, что sequelize читает уже загруженные env.
    const dbUtils = (await import('../src/utils/db')).default;
    await dbUtils.initializeDbModels();
});

afterAll(async () => {
    const { sequelize } = await import('../src/models');
    await sequelize.close();
});
