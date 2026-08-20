import User from '../models/user';
import roles, { mapRoles } from '../config/roles';

export default class UserDto {
    id!: string;
    login!: string;
    name?: string;
    isActivated!: boolean;
    isDisabled!: boolean;
    role!: keyof typeof roles;
    createdAt?: string;

    constructor(model: User) {
        this.id = model.id;
        this.login = model.login;
        this.name = model.name;
        this.isActivated = model.isActivated;
        this.isDisabled = model.isDisabled === true;
        // @ts-expect-error all checks on top level
        this.role = mapRoles[model.role];
        const createdAt = (model as unknown as { createdAt?: Date }).createdAt;
        if (createdAt) this.createdAt = createdAt.toISOString();
    }
}
