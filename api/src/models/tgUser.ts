import { DataTypes, Model, Sequelize } from 'sequelize';
import Contractor from './contractor';
import roles from '../config/roles';
import User from './user';

export default class TgUser extends Model {
    id!: string;
    name!: string;
    role!: number;
    tgId!: string;
    contractorId?: string;
    Contractor?: Contractor;
    userId?: string;
    User?: User;

    static initialize(sequelize: Sequelize) {
        TgUser.init(
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
                role: {
                    type: DataTypes.SMALLINT,
                    allowNull: false,
                    validate: {
                        isIn: [Object.values(roles)],
                    },
                    defaultValue: 1,
                },
                tgId: {
                    type: DataTypes.STRING,
                    allowNull: false,
                    unique: 'tgId',
                },
            },
            {
                sequelize,
                schema: 'public',
                modelName: 'TgUser',
                tableName: 'tgUsers',
                paranoid: true,
            }
        );
    }
}
