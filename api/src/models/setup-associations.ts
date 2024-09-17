import { models } from './index';

const { User, TokenModel, Contractor, RepairRequest, TgUser, ObjectDir, Unit, LegalEntity } = models;

export default function () {
    User.hasOne(TokenModel, { foreignKey: 'userId' });
    TokenModel.belongsTo(User, { foreignKey: 'userId' });

    Contractor.hasMany(RepairRequest, { foreignKey: 'contractorId' });
    RepairRequest.belongsTo(Contractor, { foreignKey: 'contractorId' });

    ObjectDir.hasMany(RepairRequest, { foreignKey: 'objectId', hooks: true });
    RepairRequest.belongsTo(ObjectDir, { foreignKey: 'objectId', hooks: true });

    Unit.hasMany(RepairRequest, { foreignKey: 'unitId', hooks: true });
    RepairRequest.belongsTo(Unit, { foreignKey: 'unitId', hooks: true });

    LegalEntity.hasMany(RepairRequest, { foreignKey: 'legalEntityId', hooks: true });
    RepairRequest.belongsTo(LegalEntity, { foreignKey: 'legalEntityId', hooks: true });

    Unit.hasMany(ObjectDir, { foreignKey: 'unitId' });
    ObjectDir.belongsTo(Unit, { foreignKey: 'unitId' });

    LegalEntity.hasMany(ObjectDir, { foreignKey: 'legalEntityId' });
    ObjectDir.belongsTo(LegalEntity, { foreignKey: 'legalEntityId' });

    TgUser.hasOne(Contractor, { foreignKey: 'tgUserId' });
    Contractor.belongsTo(TgUser, { foreignKey: 'tgUserId' });

    TgUser.hasOne(User, { foreignKey: 'tgManagerId' });
    User.belongsTo(TgUser, { foreignKey: 'tgManagerId' });

    TgUser.hasOne(RepairRequest, { foreignKey: 'createdBy' });
    RepairRequest.belongsTo(TgUser, { foreignKey: 'createdBy' });
}
