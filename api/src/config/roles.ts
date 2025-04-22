import { mapObjectKeys } from '../utils/mapper';

const roles = {
    USER: 1,
    ADMIN: 2,
    CUSTOMER: 3,
    CONTRACTOR: 4,
    OBSERVER: 5,
};

export default roles;

export const mapRoles = mapObjectKeys(roles);
