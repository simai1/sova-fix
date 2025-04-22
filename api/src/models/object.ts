import { DataTypes, Model, Sequelize } from 'sequelize';
import Unit from './unit';
import LegalEntity from './legalEntity';

export default class ObjectDir extends Model {
    id!: string;
    name!: string;
    number!: number;
    city!: string;
    Unit?: Unit; // unit rel
    unitId?: string;
    LegalEntity?: LegalEntity; // legal entity rel
    legalEntityId?: string;

    static initialize(sequelize: Sequelize) {
        ObjectDir.init(
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
                city: {
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

        ObjectDir.beforeCreate(async (model: ObjectDir) => {
            const maxNumber = await ObjectDir.max('number');
            if (!maxNumber || maxNumber === 0) model.set('number', 1);
            else {
                // @ts-expect-error maxNumber is always number after checks
                model.set('number', maxNumber + 1);
            }
        });
    }
}
