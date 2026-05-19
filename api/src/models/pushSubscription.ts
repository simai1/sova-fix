import { DataTypes, Model, Sequelize } from 'sequelize';
import User from './user';

export default class PushSubscription extends Model {
    id!: string;
    userId!: string;
    endpoint!: string;
    p256dhKey!: string;
    authKey!: string;
    userAgent?: string | null;
    expirationTime?: Date | null;
    lastSeenAt!: Date;
    failureCount!: number;
    createdAt!: Date;
    updatedAt!: Date;

    User?: User;

    static initialize(sequelize: Sequelize) {
        PushSubscription.init(
            {
                id: {
                    type: DataTypes.UUID,
                    defaultValue: DataTypes.UUIDV4,
                    allowNull: false,
                    primaryKey: true,
                },
                userId: {
                    type: DataTypes.UUID,
                    allowNull: false,
                    field: 'user_id',
                },
                endpoint: {
                    type: DataTypes.STRING,
                    allowNull: false,
                    unique: 'push_subscriptions_endpoint',
                },
                p256dhKey: {
                    type: DataTypes.STRING,
                    allowNull: false,
                    field: 'p256dh_key',
                },
                authKey: {
                    type: DataTypes.STRING,
                    allowNull: false,
                    field: 'auth_key',
                },
                userAgent: {
                    type: DataTypes.STRING,
                    allowNull: true,
                    field: 'user_agent',
                },
                expirationTime: {
                    type: DataTypes.DATE,
                    allowNull: true,
                    field: 'expiration_time',
                },
                lastSeenAt: {
                    type: DataTypes.DATE,
                    allowNull: false,
                    defaultValue: DataTypes.NOW,
                    field: 'last_seen_at',
                },
                failureCount: {
                    type: DataTypes.SMALLINT,
                    allowNull: false,
                    defaultValue: 0,
                    field: 'failure_count',
                },
            },
            {
                sequelize,
                schema: 'public',
                modelName: 'PushSubscription',
                tableName: 'push_subscriptions',
                indexes: [
                    {
                        name: 'push_subscriptions_user_last_seen_idx',
                        fields: ['user_id', 'last_seen_at'],
                    },
                ],
            }
        );
    }
}
