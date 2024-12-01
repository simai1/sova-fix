import { models } from './index';

const {
    User,
    TokenModel,
    Contractor,
    RepairRequest,
    TgUser,
    ObjectDir,
    Unit,
    LegalEntity,
    Category,
    Equipment,
    ExtContractor,
    History,
} = models;

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

    ExtContractor.hasMany(RepairRequest, { foreignKey: 'extContractorId', hooks: true });
    RepairRequest.belongsTo(ExtContractor, { foreignKey: 'extContractorId', hooks: true });

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

    ObjectDir.hasMany(Equipment, { foreignKey: 'objectId', hooks: true });
    Equipment.belongsTo(ObjectDir, { foreignKey: 'objectId', hooks: true });

    Unit.hasMany(Equipment, { foreignKey: 'unitId', hooks: true });
    Equipment.belongsTo(Unit, { foreignKey: 'unitId', hooks: true });

    Category.hasMany(Equipment, { foreignKey: 'categoryId' });
    Equipment.belongsTo(Category, { foreignKey: 'categoryId' });

    Contractor.hasMany(Equipment, { foreignKey: 'contractorId' });
    Equipment.belongsTo(Contractor, { foreignKey: 'contractorId' });

    ExtContractor.hasMany(Equipment, { foreignKey: 'extContractorId' });
    Equipment.belongsTo(ExtContractor, { foreignKey: 'extContractorId' });

    Equipment.hasMany(History, { foreignKey: 'equipmentId' });
    History.belongsTo(Equipment, { foreignKey: 'equipmentId' });
}
