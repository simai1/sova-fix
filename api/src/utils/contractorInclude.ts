import { IncludeOptions } from 'sequelize';
import Contractor from '../models/contractor';
import User from '../models/user';
import TgUser from '../models/tgUser';

export const contractorInclude: IncludeOptions = {
    model: Contractor,
    include: [
        { model: User, attributes: ['id', 'name'] },
        { model: TgUser, attributes: ['id', 'name', 'tgId'] },
    ],
};

export const contractorIncludeOptional: IncludeOptions = {
    ...contractorInclude,
    required: false,
};
