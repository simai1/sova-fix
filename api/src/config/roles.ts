import { mapObjectKeys } from '../utils/mapper';

const roles = {
    USER: 1,
    ADMIN: 2,
};

export default roles;

export const mapRoles = mapObjectKeys(roles);
