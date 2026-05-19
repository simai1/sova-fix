import { mapObjectKeys } from '../utils/mapper';

const roles = {
    ADMIN: 2,
    CUSTOMER: 3,
    CONTRACTOR: 4,
    OBSERVER: 5,
};

export default roles;

export const mapRoles = mapObjectKeys(roles);

export const roleNamesRu: Record<number, string> = {
    [roles.ADMIN]: 'Менеджер',
    [roles.CUSTOMER]: 'Заказчик',
    [roles.CONTRACTOR]: 'Исполнитель',
    [roles.OBSERVER]: 'Наблюдатель',
};
