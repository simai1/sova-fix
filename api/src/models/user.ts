import {DataTypes, Model, Sequelize} from "sequelize";

export default class User extends Model {
    id!: string;
    login!: string;
    password!: string;
    isActivated!: boolean;

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
                    validate: {isEmail: {msg: 'Must be a valid email address'}},
                },
                password: {
                    type: DataTypes.STRING,
                    allowNull: false,
                },
                isActivated: {
                    type: DataTypes.BOOLEAN,
                    allowNull: true,
                    defaultValue: false,
                }
            },
            {
                sequelize,
                schema: 'public',
                modelName: 'User',
                tableName: 'users',
                paranoid: true,
            }
        );
    }
};
