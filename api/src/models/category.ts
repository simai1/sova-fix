import { DataTypes, Model, Sequelize } from 'sequelize';

export default class Category extends Model {
    id!: string;
    name!: string;

    static initialize(sequelize: Sequelize) {
        Category.init(
            {
                id: {
                    type: DataTypes.UUID,
                    defaultValue: DataTypes.UUIDV4,
                    allowNull: false,
                    primaryKey: true,
                },
                name: {
                    type: DataTypes.STRING,
                    allowNull: false,
                },
            },
            {
                sequelize,
                schema: 'public',
                modelName: 'Category',
                tableName: 'categories',
                paranoid: true,
            }
        );
    }
}
