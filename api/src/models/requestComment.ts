import { DataTypes, Model, Sequelize } from 'sequelize';
import RepairRequest from './repairRequest';
import User from './user';

export default class RequestComment extends Model {
    id!: string;
    requestId!: string;
    authorUserId!: string;
    authorRole!: number;
    text!: string;
    attachment?: string | null;
    createdAt!: Date;
    updatedAt!: Date;

    Author?: User;
    Request?: RepairRequest;

    static initialize(sequelize: Sequelize) {
        RequestComment.init(
            {
                id: {
                    type: DataTypes.UUID,
                    defaultValue: DataTypes.UUIDV4,
                    allowNull: false,
                    primaryKey: true,
                },
                requestId: {
                    type: DataTypes.UUID,
                    allowNull: false,
                    field: 'request_id',
                },
                authorUserId: {
                    type: DataTypes.UUID,
                    allowNull: false,
                    field: 'author_user_id',
                },
                authorRole: {
                    type: DataTypes.SMALLINT,
                    allowNull: false,
                    field: 'author_role',
                },
                text: {
                    type: DataTypes.TEXT,
                    allowNull: false,
                },
                attachment: {
                    type: DataTypes.STRING,
                    allowNull: true,
                },
            },
            {
                sequelize,
                schema: 'public',
                modelName: 'RequestComment',
                tableName: 'request-comments',
                paranoid: true,
                indexes: [
                    {
                        name: 'request_comments_req_created_idx',
                        fields: ['request_id', 'created_at', 'id'],
                    },
                    {
                        name: 'request_comments_author_idx',
                        fields: ['author_user_id'],
                    },
                ],
            }
        );
    }
}
