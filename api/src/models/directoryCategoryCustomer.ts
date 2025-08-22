import { DataTypes, Model, Sequelize } from 'sequelize';
import DirectoryCategory from './directoryCategory';
import TgUser from './tgUser';

export default class DirectoryCategoryCustomer extends Model {
    directoryCategoryId!: string;
    tgUserId!: string;

    static initialize(sequelize: Sequelize) {
        DirectoryCategoryCustomer.init(
            {
                directoryCategoryId: {
                    type: DataTypes.UUID,
                    allowNull: false,
                    primaryKey: true,
                    references: {
                        model: DirectoryCategory,
                        key: 'id',
                    },
                },
                tgUserId: {
                    type: DataTypes.UUID,
                    allowNull: false,
                    primaryKey: true,
                    references: {
                        model: TgUser,
                        key: 'id',
                    },
                },
            },
            {
                sequelize,
                schema: 'public',
                modelName: 'DirectoryCategoryCustomer',
                tableName: 'directory_category_customers',
                timestamps: true,
                paranoid: false,
            }
        );
    }
}
