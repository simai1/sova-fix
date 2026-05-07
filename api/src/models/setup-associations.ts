import DirectoryCategory from './directoryCategory';
import DirectoryCategoryCustomer from './directoryCategoryCustomer';
import { models } from './index';
import PasswordResetToken from './passwordResetTokens';
import Status from './status';
import Urgency from './urgency';

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
    UserObject,
    RequestComment,
    UserTgBindingToken,
    PushSubscription,
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

    User.hasOne(Contractor, { foreignKey: 'userId' });
    Contractor.belongsTo(User, { foreignKey: 'userId' });

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

    // User <-> ObjectDir через UserObject (новый web-LK flow, без TG)
    User.belongsToMany(ObjectDir, { through: UserObject, foreignKey: 'userId', otherKey: 'objectId' });
    ObjectDir.belongsToMany(User, { through: UserObject, foreignKey: 'objectId', otherKey: 'userId' });
    UserObject.belongsTo(User, { foreignKey: 'userId', as: 'User' });
    UserObject.belongsTo(ObjectDir, { foreignKey: 'objectId', as: 'Object' });

    // Создатель заявки в web-flow — User (без TgUser).
    User.hasMany(RepairRequest, { foreignKey: 'createdByUserId', as: 'CreatedRequests' });
    RepairRequest.belongsTo(User, { foreignKey: 'createdByUserId', as: 'CreatedByUser' });

    Urgency.hasMany(RepairRequest, { foreignKey: 'urgencyId' });
    RepairRequest.belongsTo(Urgency, { foreignKey: 'urgencyId' });

    Status.hasMany(RepairRequest, { foreignKey: 'statusId' });
    RepairRequest.belongsTo(Status, { foreignKey: 'statusId' });

    DirectoryCategory.belongsTo(Contractor, {
        as: 'builder',
        foreignKey: 'builderId',
    });
    Contractor.hasMany(DirectoryCategory, {
        as: 'categories',
        foreignKey: 'builderId',
    });

    DirectoryCategory.belongsTo(ExtContractor, {
        as: 'builderExternal',
        foreignKey: 'builderExternalId',
    });
    ExtContractor.hasMany(DirectoryCategory, {
        as: 'categories',
        foreignKey: 'builderExternalId',
    });

    DirectoryCategory.belongsTo(TgUser, {
        as: 'manager',
        foreignKey: 'managerId',
    });
    TgUser.hasMany(DirectoryCategory, {
        as: 'managedCategories',
        foreignKey: 'managerId',
    });

    DirectoryCategory.belongsToMany(TgUser, {
        through: DirectoryCategoryCustomer,
        foreignKey: 'directoryCategoryId',
        otherKey: 'tgUserId',
        as: 'customers',
    });

    TgUser.belongsToMany(DirectoryCategory, {
        through: DirectoryCategoryCustomer,
        foreignKey: 'tgUserId',
        otherKey: 'directoryCategoryId',
        as: 'categories',
    });

    DirectoryCategory.hasMany(RepairRequest, { foreignKey: 'directoryCategoryId' });
    RepairRequest.belongsTo(DirectoryCategory, { foreignKey: 'directoryCategoryId' });

    // Чат-сообщения по заявке. CASCADE при hard-delete заявки — soft-delete
    // (paranoid) сообщения не трогает; они уйдут вместе с заявкой только
    // при force-delete.
    RepairRequest.hasMany(RequestComment, { foreignKey: 'requestId', onDelete: 'CASCADE', hooks: true });
    RequestComment.belongsTo(RepairRequest, { foreignKey: 'requestId' });

    // Автор комментария — User. Без onDelete: удаление автора не должно ломать
    // историю чата (User.paranoid=true, soft-delete'ом всё равно резолвится).
    User.hasMany(RequestComment, { foreignKey: 'authorUserId', as: 'AuthoredComments' });
    RequestComment.belongsTo(User, { foreignKey: 'authorUserId', as: 'Author' });

    // Self-binding TG-токены (deep-link через бот). Один пользователь может
    // иметь несколько записей в истории, активным считается с consumedAt=null
    // и expiresAt > now.
    User.hasMany(UserTgBindingToken, { foreignKey: 'userId', as: 'TgBindingTokens' });
    UserTgBindingToken.belongsTo(User, { foreignKey: 'userId' });

    // Web Push подписки (RFC 8030 + VAPID). При удалении юзера CASCADE'им подписки —
    // они без пользователя бесполезны и засоряют push_subscriptions.
    User.hasMany(PushSubscription, { foreignKey: 'userId', onDelete: 'CASCADE', hooks: true });
    PushSubscription.belongsTo(User, { foreignKey: 'userId' });
}
