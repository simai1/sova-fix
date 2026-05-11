import { models, sequelize } from '../models';
import { seedInitialSettings } from '../models/seedSettings';
import setupAssociations from '../models/setup-associations';
import { runPendingMigrations } from './migrator';

async function initializeDbModels() {
    for (const model of Object.values(models)) if (typeof model.initialize === 'function') model.initialize(sequelize);
    setupAssociations();

    // sync({alter:true}) оставлен только для bootstrap новых тенантов — он
    // создаёт изначальный набор таблиц из моделей. На тенантах с существующей
    // pgdata sync часто не справляется с добавлением колонок к не-пустым
    // таблицам и молча проглатывает ошибки (см. инцидент 2026-05-11 на demo).
    // Поштучный try/catch — чтобы одна сломанная модель не блокировала остальные.
    for (const model of Object.values(models)) {
        try {
            await model.sync({ alter: true });
        } catch (e) {
            console.error(`[db] sync alter failed for ${model.name || 'unknown model'}:`, (e as Error).message);
        }
    }
    console.log('models initialized');

    // Канонический способ менять схему prod-системы — миграции через umzug.
    // Применяются после sync: миграции корректируют то, что sync не смог
    // (добавление колонок к таблицам с данными, новые индексы и т.д.) и
    // ведут трекинг через таблицу SequelizeMeta, поэтому повторный запуск
    // безопасен (no-op для уже применённых).
    await runPendingMigrations();

    await seedInitialSettings();

    console.log('initial settings initialized');
}

export default {
    initializeDbModels,
};
