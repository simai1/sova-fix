import type { Migration } from '../utils/migrator';

/**
 * Дозаполняет contractors для web-исполнителей, созданных до фикса.
 *
 * POST /auth/register заводил только User: пользователь с ролью «Исполнитель»
 * был виден в справочнике пользователей, но не в справочнике исполнителей, и
 * назначить на него заявку было невозможно.
 *
 * NOT EXISTS проверяет строки и с deleted_at: мягко удалённая запись остаётся
 * в таблице ради FK из repair_requests. Заводить рядом вторую нельзя —
 * loadUserContext делает findOne и выбрал бы произвольную; такие случаи
 * разбираются руками. Отключённых пользователей пропускаем: их доступ
 * сознательно закрыт, возвращать их в справочник исполнителей не нужно.
 *
 * Заявки, ждущие подтверждения менеджером (is_activated = false при живом
 * pending_verify_token), не трогаем: им строку заведёт approveUser, и, заведи
 * её миграция заранее, после подтверждения записей стало бы две.
 */
export const up: Migration = async ({ context: queryInterface }) => {
    const [, meta] = await queryInterface.sequelize.query(`
        INSERT INTO "contractors" (id, user_id, created_at, updated_at)
        SELECT gen_random_uuid(), u.id, NOW(), NOW()
        FROM "users" u
        WHERE u.role = 4
          AND u.is_disabled IS NOT TRUE
          AND NOT (u.is_activated = FALSE AND u.pending_verify_token IS NOT NULL)
          AND NOT EXISTS (
              SELECT 1 FROM "contractors" c WHERE c.user_id = u.id
          );
    `);
    const affected = (meta as { rowCount?: number })?.rowCount ?? 0;
    if (affected > 0) console.log(`[migration:backfill-contractors-for-users] создано записей: ${affected}`);
};

/**
 * Обратной операции нет: отличить строки, созданные этой миграцией, от
 * заведённых приложением после неё, по данным невозможно — удаление снесло бы
 * и чужие, вместе со ссылками из заявок.
 */
export const down: Migration = async () => undefined;
