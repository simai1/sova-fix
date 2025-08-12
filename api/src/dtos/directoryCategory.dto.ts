import DirectoryCategory from "../models/directoryCategory";


export class DirectoryCategoryDto {
    id!: string;
    number!: number;
    name!: string;
    color!: string;
    builderId?: string | null;
    builderName?: string | null;
    customersIds?: string[] | null;
    customersName?: string[] | null;
    
    constructor(model: DirectoryCategory) {
        this.id = model.id;
        this.number = model.number;
        this.name = model.name;
        this.color = model.color;
        this.builderId = model.builderId;
        this.builderName = model.builderName;
        this.customersIds = model.customersIds;
        this.customersName = model.customersName;
    }
}
