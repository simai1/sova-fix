import { models } from './index';

const { User, TokenModel, Contractor, RepairRequest, TgUser } = models;

export default function () {
    User.hasOne(TokenModel, { foreignKey: 'userId' });
    TokenModel.belongsTo(User, { foreignKey: 'userId' });

    Contractor.hasMany(RepairRequest, { foreignKey: 'contractorId' });
    RepairRequest.belongsTo(Contractor, { foreignKey: 'contractorId' });

    TgUser.hasOne(Contractor, { foreignKey: 'tgUserId' });
    Contractor.belongsTo(TgUser, { foreignKey: 'tgUserId' });

    TgUser.hasOne(User, { foreignKey: 'tgManagerId' });
    User.belongsTo(TgUser, { foreignKey: 'tgManagerId' });

    TgUser.hasOne(RepairRequest, { foreignKey: 'createdBy' });
    RepairRequest.belongsTo(TgUser, { foreignKey: 'createdBy' });
}
