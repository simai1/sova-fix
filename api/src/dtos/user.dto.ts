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
        // createdAt нужен админке /Directory/RegistrationRequests, чтобы
        // показывать «Дата подачи». Sequelize добавляет timestamps по дефолту,
        // в БД колонка users.created_at есть и проиндексирована
        // (users_pending_created_idx). DTO раньше её просто не пробрасывал.
        const createdAt = (model as unknown as { createdAt?: Date }).createdAt;
        if (createdAt) this.createdAt = createdAt.toISOString();
    }
}
