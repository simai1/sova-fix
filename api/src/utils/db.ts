import { models, sequelize } from '../models';
import { seedInitialSettings } from '../models/seedSettings';
import setupAssociations from '../models/setup-associations';
import ensureSchema from './ensure-schema';

async function initializeDbModels() {
    for (const model of Object.values(models)) if (typeof model.initialize === 'function') model.initialize(sequelize);
    setupAssociations();

    // Idempotent raw DDL — гарантирует наличие новых таблиц/колонок ДО Sequelize.sync.
    // Защищает от двух классов проблем: (1) db-transport логгера пишет в system_logs
    // на самом первом запросе и фейлится, если sync ещё не дошёл до этой модели;
    // (2) sync({alter:true}) исторически плохо справляется с добавлением колонок
    // в таблицы с существующими данными (тенанты с pgdata из прошлых релизов).
    await ensureSchema(sequelize);

    // sync({alter:true}) поштучно с логом — раньше любая ошибка ломала весь цикл
    // молча (catch в index.ts проглатывал и уходил в retry). Теперь видим
    // конкретную модель, и одна сломанная не блокирует остальные.
    for (const model of Object.values(models)) {
        try {
            await model.sync({ alter: true });
        } catch (e) {
            console.error(`[db] sync alter failed for ${model.name || 'unknown model'}:`, (e as Error).message);
        }
    }
    console.log('models initialized');

    await seedInitialSettings();

    console.log('initial settings initialized');
}

export default {
    initializeDbModels,
};
