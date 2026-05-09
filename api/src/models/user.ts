import { DataTypes, Model, Sequelize } from 'sequelize';
import roles from '../config/roles';
import TokenModel from './token-model';
import TgUser from './tgUser';

export default class User extends Model {
    id!: string;
    login!: string;
    password!: string;
    name!: string;
    isActivated!: boolean;
    pendingApproval!: boolean;
    role!: number;
    tgManagerId?: string;
    // Хеш одноразового pending-токена (sha256 hex). Plain plain-токен не хранится:
    // он отдаётся в ответе register-public ровно один раз и живёт у клиента
    // в sessionStorage. Используется для ws-handshake subprotocol pending.<token>
    // на странице ожидания approve — pending-юзер ещё не имеет access-токена
    // (login для него отдаёт 401), но должен слышать USER_CONFIRM live.
    pendingVerifyToken?: string | null;
    pendingVerifyTokenExpiresAt?: Date | null;
    TgUser?: TgUser;

    static initialize(sequelize: Sequelize) {
        User.init(
            {
                id: {
                    type: DataTypes.UUID,
                    defaultValue: DataTypes.UUIDV4,
                    allowNull: false,
                    primaryKey: true,
                },
                login: {
                    type: DataTypes.STRING,
                    allowNull: false,
                    unique: 'login',
                    validate: { isEmail: { msg: 'Must be a valid email address' } },
                },
                password: {
                    type: DataTypes.STRING,
                    allowNull: false,
                },
                name: {
                    type: DataTypes.STRING,
                    allowNull: false,
                },
                role: {
                    type: DataTypes.SMALLINT,
                    allowNull: false,
                    validate: {
                        isIn: [Object.values(roles)],
                    },
                    defaultValue: 1,
                },
                isActivated: {
                    type: DataTypes.BOOLEAN,
                    allowNull: true,
                    defaultValue: false,
                },
                pendingApproval: {
                    type: DataTypes.BOOLEAN,
                    allowNull: false,
                    defaultValue: false,
                },
                // STRING(64) — sha256 hex от plain-токена. Без unique-constraint:
                // sync({ alter: true }) при каждом старте плодит дубль-индексы
                // на unique-полях (известный backlog), здесь сознательно не
                // создаём такую проблему. Уникальность не требуется логически:
                // токен резолвится через findOne, коллизия sha256(32bytes)
                // практически невозможна.
                pendingVerifyToken: {
                    type: DataTypes.STRING(64),
                    allowNull: true,
                    defaultValue: null,
                },
                pendingVerifyTokenExpiresAt: {
                    type: DataTypes.DATE,
                    allowNull: true,
                    defaultValue: null,
                },
            },
            {
                sequelize,
                schema: 'public',
                modelName: 'User',
                tableName: 'users',
                paranoid: true,
                indexes: [
                    {
                        name: 'users_pending_created_idx',
                        fields: ['pending_approval', 'created_at'],
                        where: { pending_approval: true },
                    },
                ],
            }
        );

        User.beforeDestroy(async (model: User) => {
            await TokenModel.destroy({ where: { userId: model.id }, force: true });
        });
    }
}
