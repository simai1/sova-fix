import { DataTypes, Model, Sequelize } from 'sequelize';

export default class Status extends Model {
    id!: string;
    number!: number;
    name!: string;
    color!: string;

    static initialize(sequelize: Sequelize) {
        Status.init(
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
                modelName: 'Statuses',
                tableName: 'statuses',
                paranoid: true,
            }
        );

        Status.beforeCreate(async (model: Status) => {
            const maxNumber = await Status.max('number');
            if (!maxNumber || maxNumber === 0) model.set('number', 1);
            else {
                // @ts-expect-error maxNumber is always number after checks
                model.set('number', maxNumber + 1);
            }
        });
    }
}
