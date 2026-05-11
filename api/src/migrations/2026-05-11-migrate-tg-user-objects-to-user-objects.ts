import { DataTypes } from 'sequelize';
import type { Migration } from '../utils/migrator';

// Миграция доступов к объектам с TgUser на User.
//
// Контекст: исторически связь юзер↔объект жила в `tgUserObjects` (tg_user_id ↔ object_id).
// После перевода авторизации на User (web-flow саморегистрации) у части юзеров TgUser
// отсутствует — кнопка «Доступы» в /Directory/UsersDirectory показывалась только при
// наличии tgId, и таким юзерам нельзя было назначить объекты. Параллельно жила правильная
// модель `userObjects` (user_id ↔ object_id), но привязки в неё не было — отсюда расхождение.
//
// Что делает миграция:
// 1) Переносит существующие связи `tgUserObjects → userObjects` по двум маппингам TgUser→User:
//    a) users.tg_manager_id (менеджеры/заказчики, у которых User создан через bot-flow);
//    b) contractors.tg_user_id + contractors.user_id (исполнители).
//    INSERT...ON CONFLICT DO NOTHING — миграция идемпотентна. Старые `tgUserObjects` не
//    удаляются: бот ещё жив и читает их при работе (`object.service.ts::getUserObjects`).
//    Они уйдут целиком вместе с TgUser-стэком (см. CLAUDE.md §«Уход от Telegram»).
//
// 2) tgUsers.tg_id → NULL allowed. Раньше tg_id был NOT NULL — это блокировало
//    «осиротевшие» TgUser-записи (например, после смены/удаления Telegram-аккаунта).
//    Postgres допускает множественные NULL под unique-constraint, существующая
//    уникальность tgId не страдает.

export const up: Migration = async ({ context: queryInterface }) => {
    // tg_id NULLable. Делаем до INSERT'ов, чтобы внутри одной транзакции umzug
    // итоговая схема была согласована с моделью.
    await queryInterface.changeColumn('tgUsers', 'tg_id', {
        type: DataTypes.STRING,
        allowNull: true,
    });

    // 1a) tgUserObjects → userObjects через User.tg_manager_id
    await queryInterface.sequelize.query(`
        INSERT INTO "userObjects" (id, user_id, object_id, created_at, updated_at)
        SELECT gen_random_uuid(), u.id, tuo.object_id, NOW(), NOW()
        FROM "tgUserObjects" tuo
        JOIN "users" u ON u.tg_manager_id = tuo.tg_user_id
        WHERE tuo.deleted_at IS NULL
          AND u.deleted_at IS NULL
        ON CONFLICT (user_id, object_id) DO NOTHING;
    `);

    // 1b) tgUserObjects → userObjects через Contractor.tg_user_id → Contractor.user_id
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
    // Перенесённые userObjects-строки не сносим — они уже могут быть отредактированы
    // через новый UI. Откатываем только schema-изменение, и то best-effort: если в
    // tgUsers есть NULL-записи, changeColumn(NOT NULL) упадёт — это нормально.
    await queryInterface
        .changeColumn('tgUsers', 'tg_id', {
            type: DataTypes.STRING,
            allowNull: false,
        })
        .catch(() => undefined);
};
