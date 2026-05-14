import { DataTypes, Model, Sequelize } from 'sequelize';
import Contractor from './contractor';
import User from './user';
import DirectoryCategory from './directoryCategory';

// TG-роли — отдельная классификация, не совпадает с web-ролями из config/roles.ts.
// Здесь намеренно явный список (включая 1, который в TG-сценариях означает обычного
// пользователя — см. request.controller.ts/resolveTgUser.ts). Уходит вместе с ботом,
// поэтому не объединяем с web-ролями (где USER=1 удалён как мусорный sentinel).
const TG_ROLES = [1, 2, 3, 4, 5];

export default class TgUser extends Model {
    id!: string;
    name!: string;
    role!: number;
    // На уровне БД tgId nullable (после миграции 2026-05-11). Тип оставлен `string`
    // намеренно — все потребители уже null-safe (truthy-проверка, template literal),
    // а расширение типа на `string | null` каскадно ломает 20+ мест в request.service
    // ради честности с runtime. Уйдёт целиком вместе со стэком TG.
    tgId!: string;
    linkId?: string;
    isConfirmed!: boolean;
    contractorId?: string;
    Contractor?: Contractor;
    userId?: string;
    User?: User;
    categories?: DirectoryCategory[];

    static initialize(sequelize: Sequelize) {
        TgUser.init(
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
                role: {
                    type: DataTypes.SMALLINT,
                    allowNull: false,
                    validate: {
                        isIn: [TG_ROLES],
                    },
                    defaultValue: 1,
                },
                // tg_id опционален: после миграции на User-ориентированную модель
                // (UserObject вместо TgUserObject, web-flow саморегистрации без TG)
                // TgUser может существовать без привязки к Telegram-аккаунту.
                // Postgres допускает несколько NULL под unique-constraint —
                // уникальность tgId среди не-NULL значений сохраняется.
                tgId: {
                    type: DataTypes.STRING,
                    allowNull: true,
                    unique: 'tgId',
                },
                linkId: {
                    type: DataTypes.STRING,
                    allowNull: true,
                    unique: 'linkId',
                },
                isConfirmed: {
                    type: DataTypes.BOOLEAN,
                    allowNull: false,
                    defaultValue: false,
                },
            },
            {
                sequelize,
                schema: 'public',
                modelName: 'TgUser',
                tableName: 'tgUsers',
                paranoid: true,
            }
        );
    }
}
