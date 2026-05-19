import { models, sequelize } from '../models';
import { seedInitialSettings } from '../models/seedSettings';
import setupAssociations from '../models/setup-associations';
import { runPendingMigrations } from './migrator';

async function initializeDbModels() {
    for (const model of Object.values(models)) if (typeof model.initialize === 'function') model.initialize(sequelize);
    setupAssociations();

    for (const model of Object.values(models)) {
        try {
            await model.sync();
        } catch (e) {
            console.error(`[db] sync failed for ${model.name || 'unknown model'}:`, (e as Error).message);
        }
    }
    console.log('models initialized');

    await runPendingMigrations();

    await seedInitialSettings();

    console.log('initial settings initialized');
}

export default {
    initializeDbModels,
};
