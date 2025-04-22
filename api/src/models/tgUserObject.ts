import { DataTypes, Model, Sequelize } from 'sequelize';
import TgUser from './tgUser';
import ObjectDir from './object';

export default class TgUserObject extends Model {
    id!: string;
    tgUserId!: string;
    objectId!: string;
    TgUser?: TgUser;
    ObjectDir?: ObjectDir;
    deletedAt?: Date | null;

    static initialize(sequelize: Sequelize) {
        TgUserObject.init(
            {
                id: {
                    type: DataTypes.UUID,
                    defaultValue: DataTypes.UUIDV4,
                    allowNull: false,
                    primaryKey: true,
                },
                tgUserId: {
                    type: DataTypes.UUID,
                    allowNull: false,
                    field: 'tg_user_id',
                    references: {
                        model: 'tgUsers',
                        key: 'id',
                    }
                },
                objectId: {
                    type: DataTypes.UUID,
                    allowNull: false,
                    field: 'object_id',
                    references: {
                        model: 'objects',
                        key: 'id',
                    }
                },
            },
            {
                sequelize,
                schema: 'public',
                modelName: 'TgUserObject',
                tableName: 'tgUserObjects',
                paranoid: true,
                underscored: true,
                indexes: [
                    {
                        unique: true,
                        fields: ['tg_user_id', 'object_id'],
                        name: 'tg_user_objects_tg_user_id_object_id'
                    },
                ],
            }
        );
    }
} 