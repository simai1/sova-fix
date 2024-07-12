import { models } from './index';

const { User, TokenModel, Contractor, RepairRequest } = models;

export default function () {
    User.hasOne(TokenModel, { foreignKey: 'userId' });
    TokenModel.belongsTo(User, { foreignKey: 'userId' });

    Contractor.hasMany(RepairRequest, { foreignKey: 'contractorId' });
    RepairRequest.belongsTo(Contractor, { foreignKey: 'contractorId' });
}
