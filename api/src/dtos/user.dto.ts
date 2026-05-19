import User from '../models/user';
import { mapRoles } from '../config/roles';

export default class UserDto {
    id!: string;
    login!: string;
    name?: string;
    isActivated!: boolean;
    role!: number;
    createdAt?: string;

    constructor(model: User) {
        this.id = model.id;
        this.login = model.login;
        this.name = model.name;
        this.isActivated = model.isActivated;
        // @ts-expect-error all checks on top level
        this.role = mapRoles[model.role];
        const createdAt = (model as unknown as { createdAt?: Date }).createdAt;
        if (createdAt) this.createdAt = createdAt.toISOString();
    }
}
