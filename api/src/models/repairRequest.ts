import { DataTypes, Model, Sequelize } from 'sequelize';
import statuses from '../config/statuses';
import Contractor from './contractor';
import ObjectDir from './object';
import Unit from './unit';

export default class RepairRequest extends Model {
    id!: string;
    number!: number;
    status!: number;
    unit!: string;
    builder!: string;
    problemDescription?: string;
    urgency!: string;
    itineraryOrder?: number;
    completeDate?: Date;
    repairPrice?: number;
    comment?: string;
    legalEntity?: string;
    daysAtWork!: number;
    fileName!: string;
    checkPhoto?: string;
    createdAt!: Date;
    createdBy!: string;
    objectId!: string;
    Unit!: Unit; // unit rel
    unitId!: string;
    Object!: ObjectDir; // object rel
    contractorId?: string;
    Contractor?: Contractor; // contractor rel

    static initialize(sequelize: Sequelize) {
        RepairRequest.init(
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
                status: {
                    type: DataTypes.SMALLINT,
                    allowNull: false,
                    validate: {
                        isIn: [Object.values(statuses)],
                    },
                    defaultValue: 1,
                },
                builder: {
                    type: DataTypes.STRING,
                    allowNull: false,
                    defaultValue: 'Укажите подрядчика',
                },
                problemDescription: {
                    type: DataTypes.STRING,
                    allowNull: true,
                },
                urgency: {
                    type: DataTypes.STRING,
                    allowNull: false,
                },
                itineraryOrder: {
                    type: DataTypes.SMALLINT,
                    allowNull: true,
                },
                completeDate: {
                    type: DataTypes.DATE,
                    allowNull: true,
                },
                repairPrice: {
                    type: DataTypes.INTEGER,
                    allowNull: true,
                },
                comment: {
                    type: DataTypes.STRING,
                    allowNull: true,
                },
                legalEntity: {
                    type: DataTypes.STRING,
                    allowNull: true,
                },
                daysAtWork: {
                    type: DataTypes.SMALLINT,
                    allowNull: false,
                    defaultValue: 0,
                },
                fileName: {
                    type: DataTypes.STRING,
                    allowNull: false,
                },
                checkPhoto: {
                    type: DataTypes.STRING,
                    allowNull: true,
                },
            },
            {
                sequelize,
                schema: 'public',
                modelName: 'RepairRequest',
                tableName: 'repair-requests',
                paranoid: true,
            }
        );

        RepairRequest.beforeCreate(async (model: RepairRequest) => {
            const maxNumber = await RepairRequest.max('number');
            if (!maxNumber || maxNumber === 0) model.set('number', 1);
            else {
                // @ts-expect-error maxNumber is always number after checks
                model.set('number', maxNumber + 1);
            }
        });
    }
}
