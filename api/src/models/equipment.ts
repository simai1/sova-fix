import { DataTypes, Model, Sequelize } from 'sequelize';
import Category from './category';
import Unit from './unit';
import ObjectDir from './object';
import Contractor from './contractor';
import ExtContractor from './externalContractor';

export default class Equipment extends Model {
    id!: string;
    number!: number;
    supportFrequency!: number;
    lastTO!: Date;
    nextTO!: Date;
    comment?: string;
    photo?: string;
    Category!: Category;
    categoryId!: string;
    Unit!: Unit;
    unitId!: string;
    Object!: ObjectDir;
    objectId!: string;
    Contractor?: Contractor;
    contractorId?: string;
    ExtContractor?: ExtContractor;
    extContractorId?: string;

    static initialize(sequelize: Sequelize) {
        Equipment.init(
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
                supportFrequency: {
                    type: DataTypes.SMALLINT,
                    allowNull: false,
                    defaultValue: 31,
                },
                lastTO: {
                    type: DataTypes.DATE,
                    allowNull: false,
                    defaultValue: DataTypes.NOW,
                },
                nextTO: {
                    type: DataTypes.DATE,
                    allowNull: false,
                },
                comment: {
                    type: DataTypes.STRING,
                    allowNull: true,
                },
                photo: {
                    type: DataTypes.STRING,
                    allowNull: true,
                },
            },
            {
                sequelize,
                schema: 'public',
                modelName: 'Equipment',
                tableName: 'equipments',
                paranoid: true,
            }
        );

        Equipment.beforeCreate(async (model: Equipment) => {
            const maxNumber = await Equipment.max('number');
            if (!maxNumber || maxNumber === 0) model.set('number', 1);
            else {
                // @ts-expect-error maxNumber is always number after checks
                model.set('number', maxNumber + 1);
            }
        });
    }
}
