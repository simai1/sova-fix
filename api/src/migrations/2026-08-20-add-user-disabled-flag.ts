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

const DISABLED_COLUMNS = {
    is_disabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    disabled_at: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    // FK на users сознательно не ставим: ещё одна ссылка на users — это ещё одна
    // причина, по которой пользователя нельзя будет удалить.
    disabled_by: {
        type: DataTypes.UUID,
        allowNull: true,
    },
} as const;

const TABLES = ['users', 'tgUsers'] as const;

export const up: Migration = async ({ context: queryInterface }: { context: QueryInterface }) => {
    for (const table of TABLES) {
        for (const [column, definition] of Object.entries(DISABLED_COLUMNS)) {
            if (await hasColumn(queryInterface, table, column)) continue;
            await queryInterface.addColumn(table, column, definition);
            console.log(`[migration:add-user-disabled-flag] ${table}.${column} added`);
        }
    }
};

export const down: Migration = async ({ context: queryInterface }: { context: QueryInterface }) => {
    for (const table of TABLES) {
        for (const column of Object.keys(DISABLED_COLUMNS)) {
            await queryInterface.removeColumn(table, column).catch(() => undefined);
        }
    }
};
