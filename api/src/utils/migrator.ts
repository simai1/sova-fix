import { QueryInterface } from 'sequelize';
import { SequelizeStorage, Umzug } from 'umzug';
import { sequelize } from '../models';

// Programmatic migration runner на базе umzug + Sequelize.
//
// Зачем не sync({alter:true}):
// Официальная дока Sequelize (v6/core-concepts/model-basics → "Synchronization
// in production") прямо рекомендует против sync alter в проде. На практике
// sync молчаливо проглатывает ошибки на одних моделях, продолжает на других,
// и итог — schema drift, обнаруживаемый только когда приложение падает
// на отсутствующей колонке (см. инцидент 2026-05-11 на demo).
//
// Зачем umzug, а не sequelize-cli:
// umzug — это та же библиотека, что лежит внутри sequelize-cli, но без
// привязки к CLI. Миграции загружаются из кода api при старте, не требуют
// отдельной команды деплоя — приходят с обычным `docker-compose up -d`.
//
// Storage:
// SequelizeStorage создаёт таблицу `SequelizeMeta` (name TEXT PRIMARY KEY)
// с записями применённых миграций. Идемпотентность гарантирована —
// up() пропустит уже применённые миграции по имени.
//
// Где живут миграции:
// `src/migrations/*.ts` (компилируются в `dist/migrations/*.js`). Каждый
// файл экспортирует `up({ context: QueryInterface })` и `down(...)`.

export type Migration = (params: { context: QueryInterface }) => Promise<void>;

// glob-путь зависит от того, запущены мы из ts (dev) или из dist (prod).
// __dirname в dev указывает на src/utils, в prod на dist/utils — в обоих случаях
// '../migrations' даёт корректный путь, glob раскрывает по существующим файлам.
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
