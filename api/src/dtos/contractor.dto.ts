import Contractor from '../models/contractor';
import { getContractorNameOrThrow } from '../utils/contractorName';

export default class ContractorDto {
    id!: string;
    name!: string;

    constructor(model: Contractor) {
        this.id = model.id;
        this.name = getContractorNameOrThrow(model);
    }
}
