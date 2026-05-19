import { DataTypes, Model, Sequelize } from 'sequelize';

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
