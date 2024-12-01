import { DataTypes, Model, Sequelize } from 'sequelize';

export default class History extends Model {
    id!: string;
    date!: Date;

    static initialize(sequelize: Sequelize) {
        History.init(
            {
                id: {
                    type: DataTypes.UUID,
                    defaultValue: DataTypes.UUIDV4,
                    allowNull: false,
                    primaryKey: true,
                },
                date: {
                    type: DataTypes.DATE,
                    allowNull: false,
                },
            },
            {
                sequelize,
                schema: 'public',
                modelName: 'History',
                tableName: 'histories',
                paranoid: true,
            }
        );
    }
}
