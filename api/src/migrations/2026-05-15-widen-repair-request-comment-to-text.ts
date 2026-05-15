import { QueryInterface } from 'sequelize';
import type { Migration } from '../utils/migrator';

// Расширение repair-requests.comment VARCHAR(255) → TEXT (2026-05-15).
//
// Контекст: comment — это write-through-кеш последнего сообщения чата заявки
// (lk.service createComment, см. CLAUDE.md «POST comment → append + write-through
// legacy RepairRequest.comment»). Текст сообщения произвольной длины; в
// VARCHAR(255) сообщение длиннее 255 символов роняло UPDATE («value too long»)
// и отдавало 500. Парная правка к миграции file_name → TEXT.
//
// Модель (models/repairRequest.ts) уже описывает поле как TEXT, но
// sync({ alter: true }) смену типа существующей колонки не применяет.

export const up: Migration = async ({ context: queryInterface }: { context: QueryInterface }) => {
    await queryInterface.sequelize.query(`
        ALTER TABLE "repair-requests" ALTER COLUMN comment TYPE TEXT;
    `);
};

export const down: Migration = async ({ context: queryInterface }: { context: QueryInterface }) => {
    // best-effort: обрезаем значения длиннее 255, чтобы ALTER не упал.
    await queryInterface.sequelize.query(`
        ALTER TABLE "repair-requests"
        ALTER COLUMN comment TYPE VARCHAR(255) USING LEFT(comment, 255);
    `);
};
