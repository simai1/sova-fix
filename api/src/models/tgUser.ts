import { DataTypes, Model, Sequelize } from 'sequelize';
import Contractor from './contractor';
import roles from '../config/roles';
import User from './user';

export default class TgUser extends Model {
    id!: string;
    name!: string;
    role!: number;
    tgId!: string;
    linkId?: string;
    isConfirmed!: boolean;
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
                linkId: {
                    type: DataTypes.STRING,
                    allowNull: true,
                    unique: 'linkId',
                },
                isConfirmed: {
                    type: DataTypes.BOOLEAN,
                    allowNull: false,
                    defaultValue: false,
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
