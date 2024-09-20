import { DataTypes, Model, Sequelize } from 'sequelize';

export default class Unit extends Model {
    id!: string;
    number!: number;
    name!: string;
    count!: number;
    description?: string;

    static initialize(sequelize: Sequelize) {
        Unit.init(
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
                count: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    defaultValue: 0,
                },
                description: {
                    type: DataTypes.STRING,
                    allowNull: true,
                },
            },
            {
                sequelize,
                schema: 'public',
                modelName: 'Unit',
                tableName: 'units',
                paranoid: true,
            }
        );

        Unit.beforeCreate(async (model: Unit) => {
            const maxNumber = await Unit.max('number');
            if (!maxNumber || maxNumber === 0) model.set('number', 1);
            else {
                // @ts-expect-error maxNumber is always number after checks
                model.set('number', maxNumber + 1);
            }
        });
    }
}
