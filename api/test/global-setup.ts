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
            'Это защита от случайного применения sync({ force: true }) к dev/prod-БД ' +
            '(force: true дропает все таблицы перед пересозданием).'
    );
}

// vitest вызывает setup() ОДИН раз перед спавном workers и teardown() после
// завершения всех файлов. Тяжёлый sync + seedInitialSettings делаем ровно
// здесь — workers подключаются к уже синхронизированной схеме и в своём
// `beforeAll` только инициализируют JS-классы моделей.
//
// Используем sync({ force: true }), а не alter: true, по двум причинам:
//   1) alter: true в Sequelize при каждом запуске добавляет новый FK-constraint
//      с автогенерируемым именем, не проверяя дубликаты — на 100+ ранов схема
//      обрастает мусорными FK на одной колонке (упирались в зависание
//      contractors.tg_user_id), и следующий alter становится O(N²).
//   2) Тестовая БД эфемерна по смыслу — фикстуры пишутся в beforeEach, между
//      ранами ничего сохранять не нужно. force: true гарантирует чистую схему
//      на каждый `npm test` без накопления артефактов.
// sequelize.sync (а не цикл по моделям) сам выстраивает порядок drop/create
// с учётом FK-зависимостей.
export async function setup() {
    const { models, sequelize } = await import('../src/models');
    const setupAssociations = (await import('../src/models/setup-associations')).default;
    const { seedInitialSettings } = await import('../src/models/seedSettings');

    for (const model of Object.values(models)) {
        if (typeof (model as any).initialize === 'function') (model as any).initialize(sequelize);
    }
    setupAssociations();
    await sequelize.sync({ force: true });
    await seedInitialSettings();

    // Закрываем соединение из main-процесса — workers создадут свои пулы.
    await sequelize.close();
}

export async function teardown() {
    // Ничего не делаем: каждый worker сам закрывает свой пул в afterAll
    // (test/setup.ts). Схему намеренно НЕ дропаем здесь — следующий npm test
    // всё равно вызовет sync({ force: true }) и пересоздаст её с нуля.
}
