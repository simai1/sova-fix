import { QueryInterface } from 'sequelize';
import type { Migration } from '../utils/migrator';

export const up: Migration = async ({ context: queryInterface }: { context: QueryInterface }) => {
    const [updated] = (await queryInterface.sequelize.query(`
        UPDATE "users"
        SET role = 3
        WHERE role = 1;
    `)) as [unknown, { rowCount?: number }];

    const rowCount = (updated as { rowCount?: number }).rowCount ?? 0;
    console.log(`[migration:remove-user-role] users.role=1 → 3 migrated: ${rowCount} rows`);

    await queryInterface.sequelize.query(`
        ALTER TABLE "users" ALTER COLUMN role DROP DEFAULT;
    `);
};

export const down: Migration = async ({ context: queryInterface }: { context: QueryInterface }) => {
    await queryInterface.sequelize.query(`
        ALTER TABLE "users" ALTER COLUMN role SET DEFAULT 1;
    `);
};
