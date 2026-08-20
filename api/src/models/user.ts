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
    pendingVerifyToken?: string | null;
    pendingVerifyTokenExpiresAt?: Date | null;
    isDisabled!: boolean;
    disabledAt?: Date | null;
    disabledBy?: string | null;
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
                },
                isActivated: {
                    type: DataTypes.BOOLEAN,
                    allowNull: true,
                    defaultValue: false,
                },
                pendingVerifyToken: {
                    type: DataTypes.STRING(64),
                    allowNull: true,
                    defaultValue: null,
                },
                pendingVerifyTokenExpiresAt: {
                    type: DataTypes.DATE,
                    allowNull: true,
                    defaultValue: null,
                },
                isDisabled: {
                    type: DataTypes.BOOLEAN,
                    allowNull: false,
                    defaultValue: false,
                },
                disabledAt: {
                    type: DataTypes.DATE,
                    allowNull: true,
                    defaultValue: null,
                },
                disabledBy: {
                    type: DataTypes.UUID,
                    allowNull: true,
                    defaultValue: null,
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

        User.beforeDestroy(async (model: User, options) => {
            await TokenModel.destroy({ where: { userId: model.id }, force: true, transaction: options.transaction });
        });
    }
}
