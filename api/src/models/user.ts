import { DataTypes, Model, Sequelize } from 'sequelize';
import roles from '../config/roles';
import TokenModel from './token-model';
import TgUser from './tgUser';

export default class User extends Model {
    id!: string;
    login!: string;
    password!: string;
    name!: string;
    isActivated!: boolean;
    role!: number;
    tgManagerId?: string;
    TgUser?: TgUser;

    static initialize(sequelize: Sequelize) {
        User.init(
            {
                id: {
                    type: DataTypes.UUID,
                    defaultValue: DataTypes.UUIDV4,
                    allowNull: false,
                    primaryKey: true,
                },
                login: {
                    type: DataTypes.STRING,
                    allowNull: false,
                    unique: 'login',
                    validate: { isEmail: { msg: 'Must be a valid email address' } },
                },
                password: {
                    type: DataTypes.STRING,
                    allowNull: false,
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
                isActivated: {
                    type: DataTypes.BOOLEAN,
                    allowNull: true,
                    defaultValue: false,
                },
            },
            {
                sequelize,
                schema: 'public',
                modelName: 'User',
                tableName: 'users',
                paranoid: true,
            }
        );

        User.beforeDestroy(async (model: User) => {
            await TokenModel.destroy({ where: { userId: model.id }, force: true });
        });
    }
}
