import { Sequelize } from 'sequelize';

// Идемпотентные DDL для таблиц/колонок, которые `sync({alter:true})` либо
// не накатывает (Sequelize плохо справляется с alter на JSONB/составных
// индексах/FK при существующих данных), либо накатывает позже, чем db-transport
// логгера успевает попытаться писать.
//
// Принцип: каждый блок здесь — это «закрепить за релизом одно конкретное
// изменение схемы». IF NOT EXISTS / DO $$ guard'ы делают повторный запуск
// безопасным (no-op). Когда модель раскатилась на все тенанты и нет смысла
// продолжать защищаться — можно удалить соответствующий блок.
//
// Это НЕ полноценные миграции (без журнала, без rollback). Это safety-net
// поверх Sequelize.sync для prod/demo тенантов, где schema drift встречается
// чаще, чем хотелось бы.
export default async function ensureSchema(sequelize: Sequelize): Promise<void> {
    const q = (sql: string) => sequelize.query(sql);

    // SystemLog — таблица для админских логов (см. systemLog.ts).
    // Создаём до sync, потому что db-transport логгера пытается писать в неё
    // сразу при первом log-вызове, а sync для этой модели может ещё не отработать.
    await q(`
        CREATE TABLE IF NOT EXISTS system_logs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            level VARCHAR(16) NOT NULL,
            message TEXT NOT NULL,
            meta JSONB,
            service VARCHAR(64) NOT NULL DEFAULT 'user-service',
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
    `);
    await q(`CREATE INDEX IF NOT EXISTS system_logs_created_at_idx ON system_logs (created_at DESC);`);
    await q(`CREATE INDEX IF NOT EXISTS system_logs_level_created_at_idx ON system_logs (level, created_at DESC);`);

    // Contractor.userId — миграция от TgUser к User (web-flow ЛК).
    await q(`ALTER TABLE contractors ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);`);
    await q(`CREATE INDEX IF NOT EXISTS contractors_user_id_idx ON contractors (user_id);`);

    // RepairRequest.createdByUserId — кто создал заявку (User, не TgUser).
    await q(`ALTER TABLE "repair-requests" ADD COLUMN IF NOT EXISTS created_by_user_id UUID REFERENCES users(id);`);

    // User.pendingApproval/pendingVerifyToken — web-самореги flow.
    await q(`ALTER TABLE users ADD COLUMN IF NOT EXISTS pending_approval BOOLEAN NOT NULL DEFAULT false;`);
    await q(`ALTER TABLE users ADD COLUMN IF NOT EXISTS pending_verify_token VARCHAR(64);`);
    await q(`ALTER TABLE users ADD COLUMN IF NOT EXISTS pending_verify_token_expires_at TIMESTAMPTZ;`);
    await q(`
        CREATE INDEX IF NOT EXISTS users_pending_created_idx
            ON users (pending_approval, created_at)
            WHERE pending_approval = true;
    `);
}
