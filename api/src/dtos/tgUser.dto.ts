import TgUser from '../models/tgUser';
import { mapRoles } from '../config/roles';
import ContractorDto from './contractor.dto';
import UserDto from './user.dto';

export default class TgUserDto {
    id!: string;
    name!: string;
    role!: number;
    tgId!: string;
    contractor?: ContractorDto | null;
    manager?: UserDto | null;

    constructor(model: TgUser) {
        this.id = model.id;
        this.name = model.name;
        // @ts-expect-error all checks on top level
        this.role = mapRoles[model.role];
        this.tgId = model.tgId;
        this.contractor = model.Contractor ? new ContractorDto(model.Contractor) : null;
        this.manager = model.User ? new UserDto(model.User) : null;
    }
}
