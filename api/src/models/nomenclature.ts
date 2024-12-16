import { DataTypes, Model, Sequelize } from 'sequelize';
import Category from './category';

export default class Nomenclature extends Model {
    id!: string;
    name!: string;
    Category?: Category;
    categoryId?: string;
    comment?: string;

    static initialize(sequelize: Sequelize) {
        Nomenclature.init(
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
                comment: {
                    type: DataTypes.STRING,
                    allowNull: true,
                },
            },
            {
                sequelize,
                schema: 'public',
                modelName: 'Nomenclature',
                tableName: 'nomenclatures',
                paranoid: true,
            }
        );
    }
}
