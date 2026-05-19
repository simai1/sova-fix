import { QueryInterface } from 'sequelize';
import { SequelizeStorage, Umzug } from 'umzug';
import { sequelize } from '../models';

export type Migration = (params: { context: QueryInterface }) => Promise<void>;

const migrationsGlob = `${__dirname}/../migrations/*.{js,ts}`;

export const migrator = new Umzug({
    migrations: { glob: migrationsGlob },
    context: sequelize.getQueryInterface(),
    storage: new SequelizeStorage({ sequelize }),
    logger: console,
});

export async function runPendingMigrations(): Promise<void> {
    const pending = await migrator.pending();
    if (pending.length === 0) {
        console.log('[migrator] no pending migrations');
        return;
    }
    console.log(`[migrator] applying ${pending.length} migration(s): ${pending.map(m => m.name).join(', ')}`);
    await migrator.up();
    console.log('[migrator] all migrations applied');
}
