import { DataTypes, Model, Sequelize } from 'sequelize';

// Таблица системных логов для админского UI (см. ТЗ §6.2 — фильтрация по
// уровню/дате). Логи immutable: timestamps=false + только createdAt
// через defaultValue=NOW. updatedAt не нужен — запись не редактируется,
// rollback не предусмотрен.
//
// Индексы:
//   created_at_idx — основной фильтр по дате (cursor-paging desc).
//   level_created_at_idx — частая комбинация «error за неделю».
// Размер таблицы — открытый вопрос: TTL/cleanup делаем отдельной задачей
// (см. backlog), здесь только сама запись.
export type SystemLogLevel = 'info' | 'warn' | 'error';

export default class SystemLog extends Model {
    id!: string;
    level!: SystemLogLevel;
    message!: string;
    meta!: Record<string, unknown> | null;
    service!: string;
    createdAt!: Date;

    static initialize(sequelize: Sequelize) {
        SystemLog.init(
            {
                id: {
                    type: DataTypes.UUID,
                    defaultValue: DataTypes.UUIDV4,
                    allowNull: false,
                    primaryKey: true,
                },
                level: {
                    type: DataTypes.STRING(16),
                    allowNull: false,
                    validate: {
                        isIn: [['info', 'warn', 'error']],
                    },
                },
                message: {
                    type: DataTypes.TEXT,
                    allowNull: false,
                },
                meta: {
                    type: DataTypes.JSONB,
                    allowNull: true,
                },
                service: {
                    type: DataTypes.STRING(64),
                    allowNull: false,
                    defaultValue: 'user-service',
                },
                createdAt: {
                    type: DataTypes.DATE,
                    allowNull: false,
                    defaultValue: DataTypes.NOW,
                    field: 'created_at',
                },
            },
            {
                sequelize,
                schema: 'public',
                modelName: 'SystemLog',
                tableName: 'system_logs',
                // updatedAt не нужен (логи immutable), createdAt назначаем
                // вручную через defaultValue, а не через Sequelize-timestamps —
                // иначе sync создаст пару (createdAt, updatedAt) и придётся
                // тащить хвост.
                timestamps: false,
                indexes: [
                    {
                        name: 'system_logs_created_at_idx',
                        fields: [{ name: 'created_at', order: 'DESC' }],
                    },
                    {
                        name: 'system_logs_level_created_at_idx',
                        fields: ['level', { name: 'created_at', order: 'DESC' }],
                    },
                ],
            }
        );
    }
}
