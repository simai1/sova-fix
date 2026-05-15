import { QueryInterface } from 'sequelize';
import type { Migration } from '../utils/migrator';

// Расширение repair-requests.file_name VARCHAR(255) → TEXT (2026-05-15).
//
// Контекст: в file_name пишется либо одно имя файла, либо JSON.stringify([...])
// со списком имён, когда к заявке приложено несколько фото (lk.service
// createForCustomer, форма /customer/requests/new — до 10 фото). Имя файла —
// `${uuid()}.${ext}` ≈ 41 символ; 10 имён в JSON-массиве — ~440 символов, что
// переполняет VARCHAR(255). Postgres отвергал INSERT («value too long»), ЛК
// отдавал 500 при создании заявки с большим числом фото.
//
// Модель (models/repairRequest.ts) уже описывает поле как TEXT, но
// sync({ alter: true }) изменение типа существующей колонки не применяет —
// поэтому правим схему явной миграцией.

export const up: Migration = async ({ context: queryInterface }: { context: QueryInterface }) => {
    await queryInterface.sequelize.query(`
        ALTER TABLE "repair-requests" ALTER COLUMN file_name TYPE TEXT;
    `);
};

export const down: Migration = async ({ context: queryInterface }: { context: QueryInterface }) => {
    // best-effort: если в колонке уже есть значения длиннее 255, откат
    // обрежет их (USING), чтобы ALTER не упал. Откат типа — редкий сценарий.
    await queryInterface.sequelize.query(`
        ALTER TABLE "repair-requests"
        ALTER COLUMN file_name TYPE VARCHAR(255) USING LEFT(file_name, 255);
    `);
};
