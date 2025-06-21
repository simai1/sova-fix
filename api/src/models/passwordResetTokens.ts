import { DataTypes, Model, Sequelize } from 'sequelize';

export default class PasswordResetToken extends Model {
    id!: string;
    userId!: string;
    token!: string;
    expiresAt!: Date;
    used!: boolean;

    static initialize(sequelize: Sequelize) {
        PasswordResetToken.init(
            {
                id: {
                    type: DataTypes.UUID,
                    defaultValue: DataTypes.UUIDV4,
                    primaryKey: true,
                },
                userId: {
                    type: DataTypes.UUID,
                    allowNull: false,
                },
                token: {
                    type: DataTypes.STRING,
                    allowNull: false,
                },
                expiresAt: {
                    type: DataTypes.DATE,
                    allowNull: false,
                },
                used: {
                    type: DataTypes.BOOLEAN,
                    allowNull: false,
                    defaultValue: false,
                },
            },
            {
                sequelize,
                schema: 'public',
                modelName: 'PasswordResetTokens',
                tableName: 'password-reset-tokens',
                timestamps: true,
                paranoid: true,
            }
        );
    }
}
