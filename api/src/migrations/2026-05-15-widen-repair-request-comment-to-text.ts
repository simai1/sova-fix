import { QueryInterface } from 'sequelize';
import type { Migration } from '../utils/migrator';

export const up: Migration = async ({ context: queryInterface }: { context: QueryInterface }) => {
    await queryInterface.sequelize.query(`
        ALTER TABLE "repair-requests" ALTER COLUMN comment TYPE TEXT;
    `);
};

export const down: Migration = async ({ context: queryInterface }: { context: QueryInterface }) => {
    await queryInterface.sequelize.query(`
        ALTER TABLE "repair-requests"
        ALTER COLUMN comment TYPE VARCHAR(255) USING LEFT(comment, 255);
    `);
};
