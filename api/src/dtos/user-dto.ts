import User from '../models/user';

export default class UserDto {
    id: string;
    login: string;
    isActivated: boolean;

    constructor(model: User) {
        this.id = model.id;
        this.login = model.login;
        this.isActivated = model.isActivated;
    }
}
