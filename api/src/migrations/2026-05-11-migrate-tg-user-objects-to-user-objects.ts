import { DataTypes } from 'sequelize';
import type { Migration } from '../utils/migrator';

export const up: Migration = async ({ context: queryInterface }) => {
    await queryInterface.changeColumn('tgUsers', 'tg_id', {
        type: DataTypes.STRING,
        allowNull: true,
    });

    await queryInterface.sequelize.query(`
        INSERT INTO "userObjects" (id, user_id, object_id, created_at, updated_at)
        SELECT gen_random_uuid(), u.id, tuo.object_id, NOW(), NOW()
        FROM "tgUserObjects" tuo
        JOIN "users" u ON u.tg_manager_id = tuo.tg_user_id
        WHERE tuo.deleted_at IS NULL
          AND u.deleted_at IS NULL
        ON CONFLICT (user_id, object_id) DO NOTHING;
    `);

    await queryInterface.sequelize.query(`
        INSERT INTO "userObjects" (id, user_id, object_id, created_at, updated_at)
        SELECT gen_random_uuid(), c.user_id, tuo.object_id, NOW(), NOW()
        FROM "tgUserObjects" tuo
        JOIN "contractors" c ON c.tg_user_id = tuo.tg_user_id
        WHERE tuo.deleted_at IS NULL
          AND c.deleted_at IS NULL
          AND c.user_id IS NOT NULL
        ON CONFLICT (user_id, object_id) DO NOTHING;
    `);
};

export const down: Migration = async ({ context: queryInterface }) => {
    await queryInterface
        .changeColumn('tgUsers', 'tg_id', {
            type: DataTypes.STRING,
            allowNull: false,
        })
        .catch(() => undefined);
};
