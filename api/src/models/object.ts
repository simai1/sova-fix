import { DataTypes, Model, Sequelize } from 'sequelize';

export default class ObjectDir extends Model {
    id!: string;
    name!: string;

    static initialize(sequelize: Sequelize) {
        ObjectDir.init(
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
                modelName: 'Object',
                tableName: 'objects',
                paranoid: true,
            }
        );
    }
}
