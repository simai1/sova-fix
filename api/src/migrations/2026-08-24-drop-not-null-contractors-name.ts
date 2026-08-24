import type { Migration } from '../utils/migrator';

export const up: Migration = async ({ context: queryInterface }) => {
    const [rows] = await queryInterface.sequelize.query(`
        SELECT is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'contractors'
          AND column_name = 'name';
    `);
    const column = (rows as Array<{ is_nullable: string }>)[0];
    if (!column || column.is_nullable === 'YES') return;

    await queryInterface.sequelize.query(`ALTER TABLE "contractors" ALTER COLUMN "name" DROP NOT NULL;`);
    console.log('[migration:drop-not-null-contractors-name] NOT NULL снят');
};

/**
 * Обратной операции нет: вернуть NOT NULL можно только заполнив name у строк,
 * созданных после миграции, а брать эти значения неоткуда — модель их не пишет.
 */
export const down: Migration = async () => undefined;
