import DirectoryCategory from '../models/directoryCategory';
import ContractorDto from './contractor.dto';
import ExtContractorDto from './extContractor.dto';
import TgUserDto from './tgUser.dto';

export class DirectoryCategoryDto {
    id!: string;
    number!: number;
    name!: string;
    color!: string;
    builder?: ContractorDto | null;
    customers?: TgUserDto[] | null;
    manager?: TgUserDto | null;
    isExternal?: boolean;
    builderExternal?: ExtContractorDto;
    isManager?: boolean;

    constructor(model: DirectoryCategory) {
        this.id = model.id;
        this.number = model.number;
        this.name = model.name;
        this.color = model.color;
        this.isExternal = model.isExternal;
        this.isManager = model.isManager;

        if (model.builder) {
            this.builder = new ContractorDto(model.builder);
        }

        if (model.builderExternal) {
            this.builderExternal = new ExtContractorDto(model.builderExternal);
        }

        if (model.manager) {
            this.manager = new TgUserDto(model.manager);
        }

        if (model.customers) {
            this.customers = model.customers.length > 0 ? model.customers.map(c => new TgUserDto(c)) : null;
        }
    }
}
