import { DataTypes, QueryInterface } from 'sequelize';
import type { Migration } from '../utils/migrator';

const hasColumn = async (queryInterface: QueryInterface, table: string, column: string): Promise<boolean> => {
    try {
        const desc = await queryInterface.describeTable(table);
        return column in desc;
    } catch {
        return false;
    }
};

const hasIndex = async (queryInterface: QueryInterface, table: string, name: string): Promise<boolean> => {
    const idx = (await queryInterface.showIndex(table)) as Array<{ name: string }>;
    return idx.some(i => i.name === name);
};

export const up: Migration = async ({ context: queryInterface }) => {
    const columnExists = await hasColumn(queryInterface, 'users', 'pending_approval');

    if (columnExists) {
        await queryInterface.sequelize.query(`
            UPDATE "users"
            SET is_activated = false
            WHERE pending_approval = true;
        `);
    }

    if (await hasIndex(queryInterface, 'users', 'users_pending_created_idx')) {
        await queryInterface.removeIndex('users', 'users_pending_created_idx');
    }
    await queryInterface.sequelize.query(`
        CREATE INDEX IF NOT EXISTS users_pending_created_idx
        ON "users" (is_activated, created_at)
        WHERE is_activated = false AND pending_verify_token IS NOT NULL;
    `);

    if (columnExists) {
        await queryInterface.removeColumn('users', 'pending_approval');
    }
};

export const down: Migration = async ({ context: queryInterface }) => {
    if (!(await hasColumn(queryInterface, 'users', 'pending_approval'))) {
        await queryInterface.addColumn('users', 'pending_approval', {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        });
    }
    await queryInterface.sequelize.query(`
        UPDATE "users"
        SET pending_approval = true, is_activated = true
        WHERE is_activated = false AND pending_verify_token IS NOT NULL;
    `);
    await queryInterface.removeIndex('users', 'users_pending_created_idx').catch(() => undefined);
    await queryInterface.addIndex('users', {
        name: 'users_pending_created_idx',
        fields: ['pending_approval', 'created_at'],
        where: { pending_approval: true },
    });
};
