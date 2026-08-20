import { DataTypes, Model, Sequelize } from 'sequelize';
import Contractor from './contractor';
import User from './user';
import DirectoryCategory from './directoryCategory';

const TG_ROLES = [1, 2, 3, 4, 5];

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
    isDisabled!: boolean;
    disabledAt?: Date | null;
    disabledBy?: string | null;
    categories?: DirectoryCategory[];

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
                        isIn: [TG_ROLES],
                    },
                    defaultValue: 1,
                },
                tgId: {
                    type: DataTypes.STRING,
                    allowNull: true,
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
                modelName: 'TgUser',
                tableName: 'tgUsers',
                paranoid: true,
            }
        );
    }
}
