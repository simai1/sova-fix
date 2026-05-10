import { DataTypes, Model, Sequelize } from 'sequelize';
import TgUser from './tgUser';
import User from './user';

// Имя контрактора — производное от связанного User.name (web-flow)
// или TgUser.name (legacy bot-flow). Колонки contractors.name намеренно нет:
// иметь два независимых поля для одного и того же ФИО — путь к рассинхрону
// (см. инцидент 2026-05-10: User.name='LK Contractor', а Contractor.name был
// руками переписан на 'ИП Иванов А.А.', и в админке/профиле показывались разные имена).
export default class Contractor extends Model {
    id!: string;
    tgUserId?: string;
    userId?: string;
    TgUser?: TgUser;
    User?: User;

    static initialize(sequelize: Sequelize) {
        Contractor.init(
            {
                id: {
                    type: DataTypes.UUID,
                    defaultValue: DataTypes.UUIDV4,
                    allowNull: false,
                    primaryKey: true,
                },
                tgUserId: {
                    type: DataTypes.UUID,
                    allowNull: true,
                },
                userId: {
                    type: DataTypes.UUID,
                    allowNull: true,
                },
            },
            {
                sequelize,
                schema: 'public',
                modelName: 'Contractor',
                tableName: 'contractors',
                paranoid: true,
                indexes: [
                    { name: 'contractors_user_id_idx', fields: ['user_id'] },
                    { name: 'contractors_tg_user_id_idx', fields: ['tg_user_id'] },
                ],
            }
        );
    }
}
