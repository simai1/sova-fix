import { DataTypes, Model, Sequelize } from 'sequelize';
import statuses from '../config/statuses';
import Contractor from './contractor';
import ObjectDir from './object';
import Unit from './unit';
import LegalEntity from './legalEntity';
import ExtContractor from './externalContractor';
import Urgency from './urgency';

export default class RepairRequest extends Model {
    id!: string;
    number!: number;
    status!: number;
    unit!: string;
    builder!: string;
    problemDescription?: string;
    urgency!: string;
    urgencyId?: string;
    itineraryOrder?: number;
    planCompleteDate?: Date;
    completeDate?: Date;
    repairPrice?: number;
    comment?: string;
    commentAttachment?: string;
    daysAtWork!: number;
    fileName!: string;
    checkPhoto?: string;
    createdAt!: Date;
    createdBy!: string;
    Unit?: Unit; // unit rel
    unitId?: string;
    Object?: ObjectDir; // object rel
    objectId?: string;
    LegalEntity?: LegalEntity; // legal entity rel
    legalEntityId?: string;
    Contractor?: Contractor; // contractor rel
    contractorId?: string;
    ExtContractor?: ExtContractor; // external contractor rel
    extContractorId?: string;
    isExternal!: boolean;
    isAutoCreated!: boolean;
    copiedRequestId?: string;

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
                urgencyId: {
                    type: DataTypes.UUID,
                    allowNull: true,
                },
                itineraryOrder: {
                    type: DataTypes.SMALLINT,
                    allowNull: true,
                },
                planCompleteDate: {
                    type: DataTypes.DATE,
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
                commentAttachment: {
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
                    allowNull: true,
                },
                checkPhoto: {
                    type: DataTypes.STRING,
                    allowNull: true,
                },
                isExternal: {
                    type: DataTypes.BOOLEAN,
                    allowNull: true,
                    defaultValue: false,
                },
                isAutoCreated: {
                    type: DataTypes.BOOLEAN,
                    allowNull: false,
                    defaultValue: false,
                },
                copiedRequestId: {
                    type: DataTypes.UUID,
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
                model.set('number', (maxNumber as number) + 1);
            }
        });
    }
}
