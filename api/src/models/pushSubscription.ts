import { DataTypes, Model, Sequelize } from 'sequelize';
import User from './user';

// Подписка на Web Push (RFC 8030 + VAPID, RFC 8292) для одного устройства/браузера юзера.
// Один user может иметь несколько подписок (десктоп + мобильный, разные браузеры).
// p256dh/auth — публичные элементы криптографии подписчика, не секреты, храним plaintext.
// Подробности — .memory-base/specs/2026-05-07-web-push-design.md §2.
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
                    // У каждого браузера/устройства один push-эндпоинт; повторный
                    // subscribe с тем же endpoint — это переоформление ключей,
                    // а не новая запись (см. §2 design-doc).
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
