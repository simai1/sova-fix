import { DataTypes, QueryInterface } from 'sequelize';
import type { Migration } from '../utils/migrator';

// Объединение двух флагов статуса юзера в один (2026-05-13).
//
// Контекст: раньше существовали два булевых поля — `isActivated` (admin-flow:
// юзера создал менеджер, активирует email-кодом) и `pendingApproval`
// (web-self-reg flow: юзер сам зарегался, менеджер одобряет). Это путало
// семантику и плодило две параллельные проверки. Теперь единый `isActivated`:
// false → «не активирован» (ждёт чего-то), true → «может пользоваться».
// Различение flow вытаскивается на уровень `pendingVerifyToken`:
//   - `pendingVerifyToken !== null` ⇒ web-self-reg, ждёт менеджера;
//   - `pendingVerifyToken === null` ⇒ admin-flow, ждёт email-кода активации.
//
// Что делает миграция:
//  1) Data-fix: всем юзерам с `pending_approval=true` ставим `is_activated=false`.
//     В обратную сторону: NULL/false в is_activated после fix'а означает либо
//     admin-flow до email-активации (это и было), либо web-self-reg до approve
//     (это раньше выражалось через pendingApproval=true).
//  2) Пересоздание partial-index `users_pending_created_idx` под новое условие
//     `is_activated=false AND pending_verify_token IS NOT NULL` —
//     запрос /Directory/RegistrationRequests ищет именно по этим полям.
//  3) Удаление колонки `pending_approval`.

const hasColumn = async (queryInterface: QueryInterface, table: string, column: string): Promise<boolean> => {
    try {
        const desc = await queryInterface.describeTable(table);
        return column in desc;
    } catch {
        return false;
    }
};

const hasIndex = async (queryInterface: QueryInterface, table: string, name: string): Promise<boolean> => {
    const idx = (await queryInterface.showIndex(table)) as Array<{ name: string }>;
    return idx.some(i => i.name === name);
};

export const up: Migration = async ({ context: queryInterface }) => {
    const columnExists = await hasColumn(queryInterface, 'users', 'pending_approval');

    if (columnExists) {
        // 1) data-fix: web-self-reg pending → is_activated=false.
        // Использует raw SQL, потому что нам нужен update «is_activated:=false
        // там, где pending_approval=true», без затрагивания других строк.
        await queryInterface.sequelize.query(`
            UPDATE "users"
            SET is_activated = false
            WHERE pending_approval = true;
        `);
    }

    // 2) Партиал-индекс. Старое условие ссылается на удаляемую колонку — снести
    // и пересоздать под новое. Делать ПЕРЕД DROP COLUMN, иначе Postgres
    // отказывается дропать колонку, на которую завязан partial-index.
    if (await hasIndex(queryInterface, 'users', 'users_pending_created_idx')) {
        await queryInterface.removeIndex('users', 'users_pending_created_idx');
    }
    // Sequelize не умеет в `where: { pending_verify_token: { [Op.ne]: null } }`
    // через addIndex (он сериализует null'ы криво для partial-index). Создаём
    // через raw SQL.
    await queryInterface.sequelize.query(`
        CREATE INDEX IF NOT EXISTS users_pending_created_idx
        ON "users" (is_activated, created_at)
        WHERE is_activated = false AND pending_verify_token IS NOT NULL;
    `);

    // 3) Удаляем колонку — модель её уже не описывает, sync({alter}) сам
    // не дропает колонки (только добавляет/изменяет тип). Делаем явно.
    if (columnExists) {
        await queryInterface.removeColumn('users', 'pending_approval');
    }
};

export const down: Migration = async ({ context: queryInterface }) => {
    // Best-effort: восстанавливаем колонку и индекс под старое условие.
    // Точно восстановить пред-апгрейдные значения (`isActivated:true` + `pendingApproval:true`)
    // мы не можем — после fix'а они слились в `isActivated:false`. Поэтому
    // принимаем эвристику: web-self-reg pending = `!is_activated && pending_verify_token IS NOT NULL`,
    // и для таких юзеров ставим pending_approval=true + is_activated=true.
    if (!(await hasColumn(queryInterface, 'users', 'pending_approval'))) {
        await queryInterface.addColumn('users', 'pending_approval', {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        });
    }
    await queryInterface.sequelize.query(`
        UPDATE "users"
        SET pending_approval = true, is_activated = true
        WHERE is_activated = false AND pending_verify_token IS NOT NULL;
    `);
    await queryInterface.removeIndex('users', 'users_pending_created_idx').catch(() => undefined);
    await queryInterface.addIndex('users', {
        name: 'users_pending_created_idx',
        fields: ['pending_approval', 'created_at'],
        where: { pending_approval: true },
    });
};
