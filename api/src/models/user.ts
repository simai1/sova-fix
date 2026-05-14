import { DataTypes, Model, Sequelize } from 'sequelize';
import roles from '../config/roles';
import TokenModel from './token-model';
import TgUser from './tgUser';

export default class User extends Model {
    id!: string;
    login!: string;
    password!: string;
    name!: string;
    // Единый флаг «активирован»: пользователь прошёл финальную проверку и может
    // логиниться. Раньше существовали два отдельных флага — `isActivated`
    // (admin-flow: email-код) и `pendingApproval` (web-self-reg: одобрение
    // менеджера); теперь оба пути ведут к одному значению `isActivated=true`.
    // Различение flow на стороне login/ws — по наличию `pendingVerifyToken`:
    // null → admin-flow ждёт email-кода, non-null → web-self-reg ждёт менеджера.
    isActivated!: boolean;
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
                },
                isActivated: {
                    type: DataTypes.BOOLEAN,
                    allowNull: true,
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
                // Partial-index `users_pending_created_idx` живёт в миграции
                // 2026-05-13-merge-pending-approval-into-is-activated.ts —
                // Sequelize sync({alter}) криво сериализует partial-index с
                // `IS NOT NULL`, поэтому не описываем его на уровне модели.
            }
        );

        User.beforeDestroy(async (model: User) => {
            await TokenModel.destroy({ where: { userId: model.id }, force: true });
        });
    }
}
