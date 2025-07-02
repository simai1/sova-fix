import { models, sequelize } from '../models';
import { seedInitialSettings } from '../models/seedSettings';
import setupAssociations from '../models/setup-associations';

async function initializeDbModels() {
    for (const model of Object.values(models)) if (typeof model.initialize === 'function') model.initialize(sequelize);
    setupAssociations();
    for (const model of Object.values(models)) await model.sync({ alter: true });
    console.log('models initialized');

    await seedInitialSettings();

    console.log('initial settings initialized')
}

export default {
    initializeDbModels,
};
