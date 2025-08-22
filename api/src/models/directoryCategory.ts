import { DataTypes, Model, Sequelize } from 'sequelize';
import User from './user';
import ExtContractor from './externalContractor';
import Contractor from './contractor';
import TgUser from './tgUser';

export default class DirectoryCategory extends Model {
    id!: string;
    number!: number;
    name!: string;
    color!: string;

    builderId?: string | null;
    builderExternalId?: string | null;
    managerId?: string | null;
    customersIds?: string[] | null;

    builder?: Contractor | null;
    builderExternal?: ExtContractor | null;
    manager?: TgUser | null;
    customers?: TgUser[] | null;

    isExternal?: boolean;
    isManager?: boolean;

    public setCustomers!: (customers: string[] | TgUser[], options?: any) => Promise<void>;
    public addCustomer!: (customer: string | TgUser, options?: any) => Promise<void>;
    public getCustomers!: (options?: any) => Promise<TgUser[]>;
    static initialize(sequelize: Sequelize) {
        DirectoryCategory.init(
            {
                id: {
                    type: DataTypes.UUID,
                    defaultValue: DataTypes.UUIDV4,
                    allowNull: false,
                    primaryKey: true,
                },
                number: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    unique: true,
                },
                name: {
                    type: DataTypes.STRING,
                    allowNull: false,
                },
                color: {
                    type: DataTypes.STRING,
                    allowNull: false,
                },
                builderId: {
                    type: DataTypes.UUID,
                    allowNull: true,
                },
                builderExternalId: {
                    type: DataTypes.UUID,
                    allowNull: true,
                },
                isForAllCustomers: {
                    type: DataTypes.BOOLEAN,
                    defaultValue: false,
                    allowNull: false
                },
                isExternal: {
                    type: DataTypes.BOOLEAN,
                    allowNull: true,
                },
                isManager: {
                    type: DataTypes.BOOLEAN,
                    allowNull: true,
                    field: 'is_manager',
                },
                managerId: {
                    type: DataTypes.UUID,
                    allowNull: true,
                }
            },
            {
                sequelize,
                schema: 'public',
                modelName: 'DirectoryCategory',
                tableName: 'directory_category',
                paranoid: true,
            }
        );

        DirectoryCategory.beforeCreate(async (model: DirectoryCategory) => {
            const maxNumber = await DirectoryCategory.max('number');
            if (!maxNumber || maxNumber === 0) model.set('number', 1);
            else {
                // @ts-expect-error maxNumber is always number after checks
                model.set('number', maxNumber + 1);
            }
        });
    }
}
