import User from '../models/user';
import { mapRoles } from '../config/roles';

export default class UserDto {
    id: string;
    login: string;
    isActivated: boolean;
    role: number;

    constructor(model: User) {
        this.id = model.id;
        this.login = model.login;
        this.isActivated = model.isActivated;
        // @ts-expect-error all checks on top level
        this.role = mapRoles[model.role];
    }
}
