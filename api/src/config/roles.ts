import { mapObjectKeys } from '../utils/mapper';

const roles = {
    ADMIN: 2,
    CUSTOMER: 3,
    CONTRACTOR: 4,
    OBSERVER: 5,
};

export default roles;

export const mapRoles = mapObjectKeys(roles);

// Русские названия ролей для текстов, которые показываются пользователю
// (ошибки доступа, тосты, badge в UI). Технические имена ADMIN/CUSTOMER/CONTRACTOR/OBSERVER
// для пользователя ничего не значат — он не знает, что такое CUSTOMER.
export const roleNamesRu: Record<number, string> = {
    [roles.ADMIN]: 'Менеджер',
    [roles.CUSTOMER]: 'Заказчик',
    [roles.CONTRACTOR]: 'Исполнитель',
    [roles.OBSERVER]: 'Наблюдатель',
};
