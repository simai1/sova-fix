import { DataTypes, Model, Sequelize } from 'sequelize';
import RepairRequest from './repairRequest';
import User from './user';

// История чат-сообщений по заявке. Введена отдельной таблицей, чтобы не ломать
// legacy-поле RepairRequest.comment (overwrite-only) — оно остаётся как
// write-through cache «последнее сообщение» для бота/админки/отчётов.
// Подробности: .memory-base/specs/2026-05-07-contractor-lk-followups-design.md §A.
export default class RequestComment extends Model {
    id!: string;
    requestId!: string;
    authorUserId!: string;
    // Снапшот числовой роли автора на момент отправки. Если менеджер позже
    // сменит юзеру роль — историческое сообщение сохранит правильную метку.
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
                    // TEXT, не STRING — UI допускает многострочный ввод; лимит
                    // длины (4000) накладываем на уровне Joi-валидации.
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
                // Soft-delete для будущей возможности «удалить сообщение» админом.
                paranoid: true,
                indexes: [
                    // Главный паттерн запроса: cursor-пагинация ASC по
                    // (request_id, created_at, id). Тай-брейкер по id нужен,
                    // чтобы keyset не зависал на одинаковых created_at.
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
