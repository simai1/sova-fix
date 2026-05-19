import { DataTypes, Model, Sequelize } from 'sequelize';
import Contractor from './contractor';
import ObjectDir from './object';
import Unit from './unit';
import LegalEntity from './legalEntity';
import ExtContractor from './externalContractor';
import TgUser from './tgUser';
import User from './user';
import DirectoryCategory from './directoryCategory';

export default class RepairRequest extends Model {
    id!: string;
    number!: number;
    status!: number;
    statusId?: string;
    unit!: string;
    builder!: string;
    problemDescription?: string;
    urgency!: string;
    urgencyId?: string;
    itineraryOrder?: number;
    planCompleteDate?: Date;
    completeDate?: Date;
    exitDate?: Date;
    repairPrice?: number;
    comment?: string;
    commentAttachment?: string;
    daysAtWork!: number;
    fileName!: string;
    checkPhoto?: string;
    createdAt!: Date;
    createdBy!: string;
    Unit?: Unit;
    unitId?: string;
    Object?: ObjectDir;
    objectId?: string;
    LegalEntity?: LegalEntity;
    legalEntityId?: string;
    Contractor?: Contractor;
    contractorId?: string;
    TgUser?: TgUser;
    managerId?: string;
    managerTgId?: string;
    ExtContractor?: ExtContractor;
    extContractorId?: string;
    isExternal!: boolean;
    isAutoCreated!: boolean;
    copiedRequestId?: string;
    DirectoryCategory?: DirectoryCategory;
    directoryCategoryId?: string | null;
    createdByUserId?: string;
    CreatedByUser?: User;

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
                    defaultValue: 1,
                },
                stasusId: {
                    type: DataTypes.UUID,
                    allowNull: true,
                },
                builder: {
                    type: DataTypes.STRING,
                    allowNull: false,
                    defaultValue: 'Укажите подрядчика',
                },
                problemDescription: {
                    type: DataTypes.TEXT,
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
                exitDate: {
                    type: DataTypes.DATE,
                    allowNull: true,
                },
                repairPrice: {
                    type: DataTypes.INTEGER,
                    allowNull: true,
                },
                comment: {
                    type: DataTypes.TEXT,
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
                    type: DataTypes.TEXT,
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
                managerId: {
                    type: DataTypes.UUID,
                    allowNull: true,
                },
                managerTgId: {
                    type: DataTypes.STRING,
                    allowNull: true,
                },
                directoryCategoryId: {
                    type: DataTypes.UUID,
                    allowNull: true,
                },
                createdByUserId: {
                    type: DataTypes.UUID,
                    allowNull: true,
                    field: 'created_by_user_id',
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
