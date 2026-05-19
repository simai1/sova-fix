import { QueryInterface } from 'sequelize';
import type { Migration } from '../utils/migrator';

export const up: Migration = async ({ context: queryInterface }: { context: QueryInterface }) => {
    await queryInterface.sequelize.query(`
        ALTER TABLE "repair-requests" ALTER COLUMN problem_description TYPE TEXT;
    `);
};

export const down: Migration = async ({ context: queryInterface }: { context: QueryInterface }) => {
    await queryInterface.sequelize.query(`
        ALTER TABLE "repair-requests"
        ALTER COLUMN problem_description TYPE VARCHAR(255) USING LEFT(problem_description, 255);
    `);
};
