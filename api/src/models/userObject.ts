import { DataTypes, Model, Sequelize } from 'sequelize';
import User from './user';
import ObjectDir from './object';

export default class UserObject extends Model {
    id!: string;
    userId!: string;
    objectId!: string;
    User?: User;
    Object?: ObjectDir;
    deletedAt?: Date | null;

    static initialize(sequelize: Sequelize) {
        UserObject.init(
            {
                id: {
                    type: DataTypes.UUID,
                    defaultValue: DataTypes.UUIDV4,
                    allowNull: false,
                    primaryKey: true,
                },
                userId: {
                    type: DataTypes.UUID,
                    allowNull: false,
                    field: 'user_id',
                    references: {
                        model: 'users',
                        key: 'id',
                    },
                },
                objectId: {
                    type: DataTypes.UUID,
                    allowNull: false,
                    field: 'object_id',
                    references: {
                        model: 'objects',
                        key: 'id',
                    },
                },
            },
            {
                sequelize,
                schema: 'public',
                modelName: 'UserObject',
                tableName: 'userObjects',
                paranoid: true,
                underscored: true,
                indexes: [
                    {
                        unique: true,
                        fields: ['user_id', 'object_id'],
                        name: 'user_objects_user_id_object_id',
                    },
                ],
            }
        );
    }
}
