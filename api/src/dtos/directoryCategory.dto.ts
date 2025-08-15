import DirectoryCategory from "../models/directoryCategory";
import ContractorDto from "./contractor.dto";
import ExtContractorDto from "./extContractor.dto";
import UserDto from "./user.dto";


export class DirectoryCategoryDto {
    id!: string;
    number!: number;
    name!: string;
    color!: string;
    builder?: ExtContractorDto | ContractorDto | null;
    customers?: UserDto[] | null;
    
    constructor(model: DirectoryCategory) {
        this.id = model.id;
        this.number = model.number;
        this.name = model.name;
        this.color = model.color;
        this.builder = model.builder;
        this.customers = model.customers;
    }
}
