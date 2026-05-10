import { IncludeOptions } from 'sequelize';
import Contractor from '../models/contractor';
import User from '../models/user';
import TgUser from '../models/tgUser';

// Стандартный include для Contractor, когда нужно отобразить имя.
// Имя Contractor производное от User.name (web-flow) или TgUser.name (legacy bot).
// Колонки contractors.name больше не существует, поэтому везде, где мы возвращаем
// клиенту что-то с Contractor, обязаны грузить эти ассоциации — иначе DTO вернёт null.
export const contractorInclude: IncludeOptions = {
    model: Contractor,
    include: [
        { model: User, attributes: ['id', 'name'] },
        { model: TgUser, attributes: ['id', 'name', 'tgId'] },
    ],
};

// То же, но с required: false (LEFT JOIN). Используется в местах, где Contractor может быть null.
export const contractorIncludeOptional: IncludeOptions = {
    ...contractorInclude,
    required: false,
};
