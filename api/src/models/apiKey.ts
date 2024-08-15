import { DataTypes, Model, Sequelize } from 'sequelize';

export default class ApiKey extends Model {
    id!: string;
    key!: string;

    static initialize(sequelize: Sequelize) {
        ApiKey.init(
            {
                id: {
                    type: DataTypes.UUID,
                    defaultValue: DataTypes.UUIDV4,
                    allowNull: false,
                    primaryKey: true,
                },
                key: {
                    type: DataTypes.UUID,
                    defaultValue: DataTypes.UUIDV4,
                    allowNull: false,
                },
            },
            {
                sequelize,
                schema: 'public',
                modelName: 'ApiKey',
                tableName: 'api-keys',
                paranoid: true,
            }
        );
    }
}
