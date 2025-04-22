import { DataTypes, Model, Sequelize } from 'sequelize';
import TgUser from './tgUser';
export default class Contractor extends Model {
    id!: string;
    name!: string;
    tgUserId?: string;
    TgUser?: TgUser;

    static initialize(sequelize: Sequelize) {
        Contractor.init(
            {
                id: {
                    type: DataTypes.UUID,
                    defaultValue: DataTypes.UUIDV4,
                    allowNull: false,
                    primaryKey: true,
                },
                name: {
                    type: DataTypes.STRING,
                    allowNull: false,
                },
            },
            {
                sequelize,
                schema: 'public',
                modelName: 'Contractor',
                tableName: 'contractors',
                paranoid: true,
            }
        );
    }
}
