import { DataTypes } from 'sequelize';
import type { Migration } from '../utils/migrator';

const hasColumn = async (
    queryInterface: import('sequelize').QueryInterface,
    table: string,
    column: string
): Promise<boolean> => {
    try {
        const desc = await queryInterface.describeTable(table);
        return column in desc;
    } catch {
        return false;
    }
};

const hasTable = async (queryInterface: import('sequelize').QueryInterface, table: string): Promise<boolean> => {
    const tables = await queryInterface.showAllTables();
    return tables.map(t => (typeof t === 'string' ? t : (t as { tableName: string }).tableName)).includes(table);
};

export const up: Migration = async ({ context: queryInterface }) => {
    if (!(await hasTable(queryInterface, 'system_logs'))) {
        await queryInterface.createTable('system_logs', {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                allowNull: false,
                primaryKey: true,
            },
            level: { type: DataTypes.STRING(16), allowNull: false },
            message: { type: DataTypes.TEXT, allowNull: false },
            meta: { type: DataTypes.JSONB, allowNull: true },
            service: { type: DataTypes.STRING(64), allowNull: false, defaultValue: 'user-service' },
            created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        });
        await queryInterface.addIndex('system_logs', {
            name: 'system_logs_created_at_idx',
            fields: [{ name: 'created_at', order: 'DESC' }],
        });
        await queryInterface.addIndex('system_logs', {
            name: 'system_logs_level_created_at_idx',
            fields: ['level', { name: 'created_at', order: 'DESC' }],
        });
    }

    if (!(await hasColumn(queryInterface, 'contractors', 'user_id'))) {
        await queryInterface.addColumn('contractors', 'user_id', {
            type: DataTypes.UUID,
            allowNull: true,
            references: { model: 'users', key: 'id' },
        });
        await queryInterface.addIndex('contractors', {
            name: 'contractors_user_id_idx',
            fields: ['user_id'],
        });
    }

    if (!(await hasColumn(queryInterface, 'repair-requests', 'created_by_user_id'))) {
        await queryInterface.addColumn('repair-requests', 'created_by_user_id', {
            type: DataTypes.UUID,
            allowNull: true,
            references: { model: 'users', key: 'id' },
        });
    }

    if (!(await hasColumn(queryInterface, 'users', 'pending_approval'))) {
        await queryInterface.addColumn('users', 'pending_approval', {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        });
    }
    if (!(await hasColumn(queryInterface, 'users', 'pending_verify_token'))) {
        await queryInterface.addColumn('users', 'pending_verify_token', {
            type: DataTypes.STRING(64),
            allowNull: true,
        });
    }
    if (!(await hasColumn(queryInterface, 'users', 'pending_verify_token_expires_at'))) {
        await queryInterface.addColumn('users', 'pending_verify_token_expires_at', {
            type: DataTypes.DATE,
            allowNull: true,
        });
    }
    const userIndexes = (await queryInterface.showIndex('users')) as Array<{ name: string }>;
    if (!userIndexes.some(i => i.name === 'users_pending_created_idx')) {
        await queryInterface.addIndex('users', {
            name: 'users_pending_created_idx',
            fields: ['pending_approval', 'created_at'],
            where: { pending_approval: true },
        });
    }
};

export const down: Migration = async ({ context: queryInterface }) => {
    await queryInterface.removeIndex('users', 'users_pending_created_idx').catch(() => undefined);
    await queryInterface.removeColumn('users', 'pending_verify_token_expires_at').catch(() => undefined);
    await queryInterface.removeColumn('users', 'pending_verify_token').catch(() => undefined);
    await queryInterface.removeColumn('users', 'pending_approval').catch(() => undefined);
    await queryInterface.removeColumn('repair-requests', 'created_by_user_id').catch(() => undefined);
    await queryInterface.removeIndex('contractors', 'contractors_user_id_idx').catch(() => undefined);
    await queryInterface.removeColumn('contractors', 'user_id').catch(() => undefined);
    await queryInterface.dropTable('system_logs').catch(() => undefined);
};
