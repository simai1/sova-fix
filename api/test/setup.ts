import * as dotenv from 'dotenv';
import { beforeAll, afterAll } from 'vitest';
import buffer from 'buffer';

// Полифилл для Node >= 22, где `Buffer.SlowBuffer` удалён, но устаревшая
// транзитивная зависимость `buffer-equal-constant-time` (через `jsonwebtoken`)
// читает её на верхнем уровне и падает с
//   TypeError: Cannot read properties of undefined (reading 'prototype').
// Без этой подпорки любой тест-сьют, импортирующий app.ts/utils/jwt, валится
// на этапе сбора. Применяем только в test-окружении.
if (!(buffer as any).SlowBuffer) {
    (buffer as any).SlowBuffer = buffer.Buffer;
}

// Загружаем .env.test.local строго до импорта моделей/sequelize.
// ВАЖНО: ES-модули хойстят import'ы наверх, поэтому модели/sequelize грузим
// динамически в beforeAll — иначе они увидят пустой process.env.
dotenv.config({ path: `.env.${process.env.NODE_ENV}.local` });

// SAFEGUARD: убеждаемся, что мы в test-среде и БД содержит "test".
// Тяжёлый sync({ force: true }) теперь делает test/global-setup.ts (один раз
// перед спавном workers), но safety-чек дублируем — на случай прямого запуска
// `vitest run` без globalSetup.
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
            'Это защита от случайного применения sync({ force: true }) к dev/prod-БД ' +
            '(force: true дропает все таблицы перед пересозданием).'
    );
}

beforeAll(async () => {
    // Эквивалент `dbUtils.initializeDbModels()`, но БЕЗ sync({ force: true }) и
    // без seedInitialSettings — оба тяжёлых шага уже выполнены один раз в
    // test/global-setup.ts перед спавном vitest-workers. Здесь нам нужно
    // только инициализировать JS-классы моделей в текущем процессе worker'а
    // (форк не наследует init модели) и поднять ассоциации. Это дёшево —
    // никаких SQL-запросов, только конфиг JS-классов.
    const { models, sequelize } = await import('../src/models');
    const setupAssociations = (await import('../src/models/setup-associations')).default;
    for (const model of Object.values(models)) {
        if (typeof (model as any).initialize === 'function') (model as any).initialize(sequelize);
    }
    setupAssociations();
});

afterAll(async () => {
    const { sequelize } = await import('../src/models');
    await sequelize.close();
});
