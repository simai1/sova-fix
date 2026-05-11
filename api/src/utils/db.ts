import { models, sequelize } from '../models';
import { seedInitialSettings } from '../models/seedSettings';
import setupAssociations from '../models/setup-associations';
import { runPendingMigrations } from './migrator';

async function initializeDbModels() {
    for (const model of Object.values(models)) if (typeof model.initialize === 'function') model.initialize(sequelize);
    setupAssociations();

    // sync() без alter — bootstrap новых тенантов: создаёт отсутствующие
    // таблицы из моделей. Существующие не трогаются. Изменения схемы
    // (новые колонки, индексы, типы) идут ИСКЛЮЧИТЕЛЬНО через миграции umzug
    // ниже, потому что sync({alter:true}) в продакшене не рекомендован
    // официальной докой Sequelize и на практике зависает / молча проглатывает
    // ошибки на тенантах с существующей pgdata (инцидент 2026-05-11 на demo).
    // Поштучный try/catch — изоляция между моделями.
    for (const model of Object.values(models)) {
        try {
            await model.sync();
        } catch (e) {
            console.error(`[db] sync failed for ${model.name || 'unknown model'}:`, (e as Error).message);
        }
    }
    console.log('models initialized');

    // Канонический способ менять схему prod-системы — миграции через umzug.
    // SequelizeStorage ведёт трекинг через таблицу SequelizeMeta, повторный
    // запуск безопасен (no-op для уже применённых).
    await runPendingMigrations();

    await seedInitialSettings();

    console.log('initial settings initialized');
}

export default {
    initializeDbModels,
};
