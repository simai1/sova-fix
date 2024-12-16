import { DataTypes, Model, Sequelize } from 'sequelize';

export default class Category extends Model {
    id!: string;
    name!: string;
    comment?: string;

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
                    unique: true,
                },
                comment: {
                    type: DataTypes.STRING,
                    allowNull: true,
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
