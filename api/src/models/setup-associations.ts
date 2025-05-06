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
    Nomenclature,
    TechService,
    TgUserObject,
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

    // Add manager relation
    TgUser.hasMany(RepairRequest, { foreignKey: 'managerId' });
    RepairRequest.belongsTo(TgUser, { foreignKey: 'managerId' });

    ObjectDir.hasMany(Equipment, { foreignKey: 'objectId', hooks: true });
    Equipment.belongsTo(ObjectDir, { foreignKey: 'objectId', hooks: true });

    Unit.hasMany(Equipment, { foreignKey: 'unitId', hooks: true });
    Equipment.belongsTo(Unit, { foreignKey: 'unitId', hooks: true });

    Contractor.hasMany(Equipment, { foreignKey: 'contractorId' });
    Equipment.belongsTo(Contractor, { foreignKey: 'contractorId' });

    ExtContractor.hasMany(Equipment, { foreignKey: 'extContractorId' });
    Equipment.belongsTo(ExtContractor, { foreignKey: 'extContractorId' });

    Category.hasMany(Nomenclature, { foreignKey: 'categoryId' });
    Nomenclature.belongsTo(Category, { foreignKey: 'categoryId' });

    Nomenclature.hasMany(Equipment, { foreignKey: 'nomenclatureId' });
    Equipment.belongsTo(Nomenclature, { foreignKey: 'nomenclatureId' });

    Equipment.hasMany(TechService, { foreignKey: 'equipmentId' });
    TechService.belongsTo(Equipment, { foreignKey: 'equipmentId' });

    Contractor.hasMany(TechService, { foreignKey: 'contractorId' });
    TechService.belongsTo(Contractor, { foreignKey: 'contractorId' });

    ExtContractor.hasMany(TechService, { foreignKey: 'extContractorId' });
    TechService.belongsTo(ExtContractor, { foreignKey: 'extContractorId' });

    // Setup TgUser to ObjectDir many-to-many relationship
    TgUser.belongsToMany(ObjectDir, { through: TgUserObject, foreignKey: 'tgUserId', otherKey: 'objectId' });
    ObjectDir.belongsToMany(TgUser, { through: TgUserObject, foreignKey: 'objectId', otherKey: 'tgUserId' });

    // Важные ассоциации для правильной работы с объектами
    TgUserObject.belongsTo(TgUser, { foreignKey: 'tgUserId', as: 'User' });
    TgUserObject.belongsTo(ObjectDir, { foreignKey: 'objectId', as: 'Object' });
}
