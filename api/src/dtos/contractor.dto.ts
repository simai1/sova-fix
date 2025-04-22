import Contractor from '../models/contractor';

export default class ContractorDto {
    id!: string;
    name!: string;

    constructor(model: Contractor) {
        this.id = model.id;
        this.name = model.name;
    }
}
