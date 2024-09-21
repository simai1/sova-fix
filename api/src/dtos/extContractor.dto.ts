import ExtContractor from '../models/externalContractor';

export default class ExtContractorDto {
    id!: string;
    number!: number;
    name!: string;
    spec!: string;
    legalForm!: string;

    constructor(model: ExtContractor) {
        this.id = model.id;
        this.number = model.number;
        this.name = model.name;
        this.spec = model.spec;
        this.legalForm = model.legalForm;
    }
}
