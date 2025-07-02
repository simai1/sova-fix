import { DataTypes, Model, Sequelize } from 'sequelize';

export default class Settings extends Model {
    id!: string;
    setting!: string;
    name!: string;
    value!: boolean;

    static initialize(sequelize: Sequelize) {
        Settings.init(
            {
                id: {
                    type: DataTypes.UUID,
                    defaultValue: DataTypes.UUIDV4,
                    allowNull: false,
                    primaryKey: true,
                },
                setting: {
                    type: DataTypes.STRING,
                    allowNull: false,
                    unique: true,
                },
                value: {
                    type: DataTypes.BOOLEAN,
                    allowNull: false,
                },
                name: {
                    type: DataTypes.STRING,
                    allowNull: false,
                }
            },
            {
                sequelize,
                schema: 'public',
                modelName: 'Settings',
                tableName: 'settings',
                paranoid: true,
            }
        );
    }
}
