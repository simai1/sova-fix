import type { Migration } from '../utils/migrator';

/**
 * Убирает из выборок записи contractors без userId и tgUserId.
 */
export const up: Migration = async ({ context: queryInterface }) => {
    const [, meta] = await queryInterface.sequelize.query(`
        UPDATE "contractors"
        SET deleted_at = NOW()
        WHERE deleted_at IS NULL
          AND user_id IS NULL
          AND tg_user_id IS NULL;
    `);
    const affected = (meta as { rowCount?: number })?.rowCount ?? 0;
    if (affected > 0) console.log(`[migration:soft-delete-orphan-contractors] скрыто записей: ${affected}`);
};

/**
 * Обратной операции нет: какие именно строки скрыла миграция, а какие уже были
 * мягко удалены до неё, по deleted_at не различить. Возврат «оживил» бы чужие.
 */
export const down: Migration = async () => undefined;
