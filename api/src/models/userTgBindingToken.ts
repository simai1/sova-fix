import { DataTypes, Model, Sequelize } from 'sequelize';
import User from './user';

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
