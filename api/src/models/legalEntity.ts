import { DataTypes, Model, Sequelize } from 'sequelize';

export default class LegalEntity extends Model {
    id!: string;
    number!: number;
    name!: string;
    legalForm!: string;
    count!: number;
    startCoop!: Date;

    static initialize(sequelize: Sequelize) {
        LegalEntity.init(
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
                legalForm: {
                    type: DataTypes.STRING,
                    allowNull: false,
                },
                count: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    defaultValue: 1,
                },
                startCoop: {
                    type: DataTypes.DATE,
                    allowNull: false,
                },
            },
            {
                sequelize,
                schema: 'public',
                modelName: 'LegalEntity',
                tableName: 'legal-entities',
                paranoid: true,
            }
        );

        LegalEntity.beforeCreate(async (model: LegalEntity) => {
            const maxNumber = await LegalEntity.max('number');
            if (!maxNumber || maxNumber === 0) model.set('number', 1);
            else {
                // @ts-expect-error maxNumber is always number after checks
                model.set('number', maxNumber + 1);
            }
        });
    }
}
