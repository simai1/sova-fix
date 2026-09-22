import type { Migration } from '../utils/migrator';

/**
 * Приводит tgUserObjects (доступы в Telegram-боте) в соответствие с userObjects
 * (веб-справочник доступов — источник правды).
 *
 * Расхождение накопилось после 2026-05-11-migrate-tg-user-objects-to-user-objects:
 * та миграция перенесла связи из tgUserObjects в userObjects в одну сторону, после
 * чего веб писал только в userObjects, а бот продолжал читать tgUserObjects. Всё,
 * что админы меняли в вебе с тех пор, до бота не доезжало: у исполнителя могло
 * стоять 11 объектов в вебе и 9 в боте.
 *
 * Telegram-аккаунт ищем там же, где его ищет setUserObjects: у исполнителя в
 * contractors.tg_user_id, у менеджера в users.tg_manager_id.
 *
 * Отключённых (is_disabled) пропускаем: их доступ закрыт сознательно, а
 * setUserDisabled уже вычистил обе таблицы — возвращать связи не нужно.
 *
 * Лишние связи в боте (есть в tgUserObjects, нет в userObjects) НЕ снимаем:
 * это сужение прав, и делать его молча, миграцией, неправильно. Такие случаи
 * видно запросом из комментария в конце файла — разбираются отдельно.
 */
export const up: Migration = async ({ context: queryInterface }) => {
    // Общий источник пар «web-пользователь → его tgUser».
    const linkedUsers = `
        SELECT u.id AS user_id,
               COALESCE(c.tg_user_id, u.tg_manager_id) AS tg_user_id
        FROM "users" u
        LEFT JOIN "contractors" c ON c.user_id = u.id AND c.deleted_at IS NULL
        WHERE u.deleted_at IS NULL
          AND u.is_disabled IS NOT TRUE
          AND COALESCE(c.tg_user_id, u.tg_manager_id) IS NOT NULL
    `;

    // 1. Восстанавливаем soft-deleted связи: unique-индекс по паре
    //    (tg_user_id, object_id) учитывает и удалённые строки, поэтому просто
    //    вставить их заново нельзя.
    const [, restoreMeta] = await queryInterface.sequelize.query(`
        UPDATE "tgUserObjects" tuo
        SET deleted_at = NULL,
            updated_at = NOW()
        FROM (${linkedUsers}) m
        WHERE tuo.tg_user_id = m.tg_user_id
          AND tuo.deleted_at IS NOT NULL
          AND EXISTS (
              SELECT 1 FROM "userObjects" uo
               WHERE uo.user_id = m.user_id
                 AND uo.object_id = tuo.object_id
                 AND uo.deleted_at IS NULL
          );
    `);
    const restored = (restoreMeta as { rowCount?: number })?.rowCount ?? 0;

    // 2. Добавляем недостающие.
    const [, insertMeta] = await queryInterface.sequelize.query(`
        INSERT INTO "tgUserObjects" (id, tg_user_id, object_id, created_at, updated_at)
        SELECT gen_random_uuid(), m.tg_user_id, uo.object_id, NOW(), NOW()
        FROM (${linkedUsers}) m
        JOIN "userObjects" uo ON uo.user_id = m.user_id AND uo.deleted_at IS NULL
        ON CONFLICT (tg_user_id, object_id) DO NOTHING;
    `);
    const inserted = (insertMeta as { rowCount?: number })?.rowCount ?? 0;

    if (restored > 0 || inserted > 0) {
        console.log(
            `[migration:sync-user-objects-to-tg-user-objects] восстановлено: ${restored}, добавлено: ${inserted}`
        );
    }
};

/**
 * Обратной операции нет: отличить связи, созданные этой миграцией, от заведённых
 * приложением после неё, по данным невозможно — откат снёс бы и рабочие доступы.
 *
 * Проверить оставшийся перекос (доступы, которые есть в боте, но не в вебе):
 *   SELECT u.name, o.name
 *   FROM "tgUserObjects" tuo
 *   JOIN "contractors" c ON c.tg_user_id = tuo.tg_user_id AND c.deleted_at IS NULL
 *   JOIN "users" u ON u.id = c.user_id AND u.deleted_at IS NULL
 *   JOIN "objects" o ON o.id = tuo.object_id
 *   WHERE tuo.deleted_at IS NULL
 *     AND NOT EXISTS (SELECT 1 FROM "userObjects" uo
 *                      WHERE uo.user_id = u.id AND uo.object_id = tuo.object_id
 *                        AND uo.deleted_at IS NULL);
 */
export const down: Migration = async () => undefined;
