import { DataTypes, Model, Sequelize } from 'sequelize';
import TgUser from './tgUser';
import User from './user';

export default class Contractor extends Model {
    id!: string;
    name!: string;
    tgUserId?: string;
    userId?: string;
    TgUser?: TgUser;
    User?: User;

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
                tgUserId: {
                    type: DataTypes.UUID,
                    allowNull: true,
                },
                userId: {
                    type: DataTypes.UUID,
                    allowNull: true,
                },
            },
            {
                sequelize,
                schema: 'public',
                modelName: 'Contractor',
                tableName: 'contractors',
                paranoid: true,
                indexes: [
                    { name: 'contractors_user_id_idx', fields: ['user_id'] },
                    { name: 'contractors_tg_user_id_idx', fields: ['tg_user_id'] },
                ],
            }
        );
    }
}
