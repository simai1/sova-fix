import { DataTypes, Model, Sequelize } from 'sequelize';

export default class DirectoryCategory extends Model {
    id!: string;
    number!: number;
    name!: string;
    color!: string;
    builderId?: string | null;
    builderName?: string | null;
    customersIds?: string[] | null;
    customersName?: string[] | null;

    static initialize(sequelize: Sequelize) {
        DirectoryCategory.init(
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
                builderId: {
                    type: DataTypes.UUID,
                    allowNull: true,
                },
                builderName: {
                    type: DataTypes.STRING,
                    allowNull: true,
                },
                customersIds: {
                    type: DataTypes.ARRAY(DataTypes.UUID),
                    allowNull: true,
                },
                customersName: {
                    type: DataTypes.ARRAY(DataTypes.STRING),
                    allowNull: true,
                },
            },
            {
                sequelize,
                schema: 'public',
                modelName: 'DirectoryCategory',
                tableName: 'directory_category',
                paranoid: true,
            }
        );

        DirectoryCategory.beforeCreate(async (model: DirectoryCategory) => {
            const maxNumber = await DirectoryCategory.max('number');
            if (!maxNumber || maxNumber === 0) model.set('number', 1);
            else {
                // @ts-expect-error maxNumber is always number after checks
                model.set('number', maxNumber + 1);
            }
        });
    }
}
