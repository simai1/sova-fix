import { DataTypes, Model, Sequelize } from 'sequelize';
import RepairRequest from './repairRequest';

export default class Urgency extends Model {
    id!: string;
    number!: number;
    name!: string;
    color!: string;

    static initialize(sequelize: Sequelize) {
        Urgency.init(
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
            },
            {
                sequelize,
                schema: 'public',
                modelName: 'Urgency',
                tableName: 'urgency',
                paranoid: true,
            }
        );

        Urgency.beforeCreate(async (model: Urgency) => {
            const maxNumber = await Urgency.max('number');
            if (!maxNumber || maxNumber === 0) model.set('number', 1);
            else {
                // @ts-expect-error maxNumber is always number after checks
                model.set('number', maxNumber + 1);
            }
        });
    }

    static associate() {
        Urgency.hasMany(RepairRequest, {
            foreignKey: 'urgencyId',
            as: 'RepairRequests',
        });
    }
}
