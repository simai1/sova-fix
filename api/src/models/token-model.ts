import { DataTypes, Model, Sequelize } from 'sequelize';

export default class TokenModel extends Model {
    id!: string;
    refreshToken!: string;
    static initialize(sequelize: Sequelize) {
        TokenModel.init(
            {
                id: {
                    type: DataTypes.UUID,
                    defaultValue: DataTypes.UUIDV4,
                    allowNull: false,
                    primaryKey: true,
                },
                refreshToken: { type: DataTypes.STRING, allowNull: false },
            },
            {
                sequelize,
                schema: 'public',
                modelName: 'TokenModel',
                tableName: 'token-model',
                paranoid: true,
            }
        );
    }
}
