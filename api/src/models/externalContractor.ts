import { DataTypes, Model, Sequelize } from 'sequelize';

export default class ExtContractor extends Model {
    id!: string;
    number!: number;
    name!: string;
    spec!: string;
    legalForm!: string;

    static initialize(sequelize: Sequelize) {
        ExtContractor.init(
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
                spec: {
                    type: DataTypes.STRING,
                    allowNull: false,
                },
                legalForm: {
                    type: DataTypes.STRING,
                    allowNull: false,
                },
            },
            {
                sequelize,
                schema: 'public',
                modelName: 'ExtContractor',
                tableName: 'external-contractors',
                paranoid: true,
            }
        );

        ExtContractor.beforeCreate(async (model: ExtContractor) => {
            const maxNumber = await ExtContractor.max('number');
            if (!maxNumber || maxNumber === 0) model.set('number', 1);
            else {
                // @ts-expect-error maxNumber is always number after checks
                model.set('number', maxNumber + 1);
            }
        });
    }
}
