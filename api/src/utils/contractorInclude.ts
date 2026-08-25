import { IncludeOptions } from 'sequelize';
import Contractor from '../models/contractor';
import User from '../models/user';
import TgUser from '../models/tgUser';

/**
 * Поля User, из которых utils/contractorName выводит имя исполнителя.
 * login здесь обязателен: у созданного через POST /auth/register исполнителя
 * name пуст до активации, и без login getContractorName вернёт null —
 * ContractorDto.fromModel выбросит такую запись из справочника целиком.
 */
export const contractorUserAttributes = ['id', 'name', 'login'];

export const contractorInclude: IncludeOptions = {
    model: Contractor,
    include: [
        { model: User, attributes: contractorUserAttributes },
        { model: TgUser, attributes: ['id', 'name', 'tgId'] },
    ],
};

export const contractorIncludeOptional: IncludeOptions = {
    ...contractorInclude,
    required: false,
};
