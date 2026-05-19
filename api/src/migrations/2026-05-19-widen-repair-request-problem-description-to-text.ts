import { QueryInterface } from 'sequelize';
import type { Migration } from '../utils/migrator';

// Расширение repair-requests.problem_description VARCHAR(255) → TEXT (2026-05-19).
//
// Контекст: problem_description — это описание проблемы, которое пользователь
// вводит в форме создания заявки. Текст произвольной длины; в VARCHAR(255)
// описание длиннее 255 символов роняло INSERT («value too long») и отдавало 500.
// В одном ряду с миграциями comment → TEXT и file_name → TEXT.
//
// Модель (models/repairRequest.ts) уже описывает поле как TEXT, но
// sync({ alter: true }) смену типа существующей колонки не применяет.

export const up: Migration = async ({ context: queryInterface }: { context: QueryInterface }) => {
    await queryInterface.sequelize.query(`
        ALTER TABLE "repair-requests" ALTER COLUMN problem_description TYPE TEXT;
    `);
};

export const down: Migration = async ({ context: queryInterface }: { context: QueryInterface }) => {
    // best-effort: обрезаем значения длиннее 255, чтобы ALTER не упал.
    await queryInterface.sequelize.query(`
        ALTER TABLE "repair-requests"
        ALTER COLUMN problem_description TYPE VARCHAR(255) USING LEFT(problem_description, 255);
    `);
};
