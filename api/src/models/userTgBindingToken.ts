import { DataTypes, Model, Sequelize } from 'sequelize';
import User from './user';

// Короткоживущие одноразовые токены для self-binding TG_ID через бот-deep-link.
// В БД храним SHA-256 от plaintext-токена; plaintext отдаётся фронту один раз.
// Подробности: .memory-base/specs/2026-05-07-contractor-lk-followups-design.md §D.
export default class UserTgBindingToken extends Model {
    id!: string;
    userId!: string;
    tokenHash!: string;
    expiresAt!: Date;
    consumedAt?: Date | null;
    createdAt!: Date;
    updatedAt!: Date;

    User?: User;

    static initialize(sequelize: Sequelize) {
        UserTgBindingToken.init(
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
                tokenHash: {
                    type: DataTypes.STRING,
                    allowNull: false,
                    // Уникальность по hash: коллизии SHA-256 не ожидаются;
                    // дополнительно гарантирует, что один и тот же plaintext
                    // не запишется дважды (при редком race-condition'е).
                    unique: 'user_tg_binding_token_hash',
                    field: 'token_hash',
                },
                expiresAt: {
                    type: DataTypes.DATE,
                    allowNull: false,
                    field: 'expires_at',
                },
                consumedAt: {
                    type: DataTypes.DATE,
                    allowNull: true,
                    field: 'consumed_at',
                },
            },
            {
                sequelize,
                schema: 'public',
                modelName: 'UserTgBindingToken',
                tableName: 'user-tg-binding-tokens',
                indexes: [
                    {
                        name: 'user_tg_binding_tokens_user_expires_idx',
                        fields: ['user_id', 'expires_at'],
                    },
                ],
            }
        );
    }
}
