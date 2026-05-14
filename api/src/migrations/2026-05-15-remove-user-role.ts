import { QueryInterface } from 'sequelize';
import type { Migration } from '../utils/migrator';

// Удаление мусорной роли USER=1 (2026-05-15).
//
// Контекст: в config/roles.ts исторически жила USER=1 как defaultValue колонки
// users.role и как «свежезареганный, без роли» sentinel для admin-flow
// /auth/register (контроллер не принимал role; полагался на default; менеджер
// потом отдельно выставлял настоящую роль через /users/setRole). Эта роль не
// проверялась ни одним verifyRole, не получала ни одного targeted-WS-события,
// в notification.service.getManagerUserIds не попадала. По факту — переходное
// состояние, в котором юзер ничего не мог. Tech debt.
//
// Что меняем кодом (вне миграции):
//  - roles.ts/notificationLabels.ts: USER:1 удалён.
//  - models/user.ts: defaultValue=1 убран; isIn-валидация теперь не принимает 1.
//  - auth.controller.registerViaEmail: role стал обязательным параметром body.
//  - фронт (UsersDirectory.jsx / UniversalTable.jsx / PopUpCreateUser):
//    выбор «Пользователь» убран, в форме создания юзера обязательный select роли.
//  - TgUser остаётся со своей TG-классификацией [1..5] (отвязан от config/roles),
//    потому что в TG-сценариях 1 означает обычного пользователя бота и эта ветка
//    уйдёт вся целиком вместе с ботом.
//
// Что делает миграция:
//  1) Data-fix: всем `users.role = 1` ставим CUSTOMER=3 — это самая частая роль
//     для конечных юзеров (web-self-reg и admin-flow в ~80% случаев), для legacy
//     зависших аккаунтов безопасный fallback. Менеджер сможет переключить роль
//     через /users/setRole при необходимости.
//  2) Снимаем DEFAULT 1 с колонки users.role: модель его больше не описывает,
//     но Postgres сохранил его исторически — без явного DROP DEFAULT на следующем
//     `sequelize.sync()` для нового тенанта default-1 переедет в чистую БД.
//
// down — best-effort: вернуть «настоящих» role=1 юзеров мы не можем (они слились
// с CUSTOMER), поэтому down просто восстанавливает DEFAULT 1. Не пытается
// откатить data-fix.

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
