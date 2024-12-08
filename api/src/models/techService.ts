import { DataTypes, Model, Sequelize } from 'sequelize';
import Contractor from './contractor';
import ExtContractor from './externalContractor';

export default class TechService extends Model {
    id!: string;
    date!: Date;
    sum!: number;
    countEquipment!: number;
    contractorId?: string;
    Contractor?: Contractor;
    extContractorId?: string;
    ExtContractor?: ExtContractor;

    static initialize(sequelize: Sequelize) {
        TechService.init(
            {
                id: {
                    type: DataTypes.UUID,
                    defaultValue: DataTypes.UUIDV4,
                    allowNull: false,
                    primaryKey: true,
                },
                date: {
                    type: DataTypes.DATE,
                    allowNull: false,
                    defaultValue: DataTypes.NOW,
                },
                sum: {
                    type: DataTypes.REAL,
                    allowNull: false,
                },
                countEquipment: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                },
            },
            {
                sequelize,
                schema: 'public',
                modelName: 'TechService',
                tableName: 'tech-services',
                paranoid: true,
            }
        );
    }
}
