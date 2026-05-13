import strftime from '../utils/strftime';
import TechService from '../models/techService';
import { getContractorNameOrThrow } from '../utils/contractorName';

export default class TechServiceDto {
    id!: string;
    date!: Date;
    dateHuman!: string;
    extContractor?: string;
    extContractorId?: string;
    contractor?: string;
    contractorId?: string;
    sum!: number;
    countEquipment!: number;
    comment?: string;

    constructor(model: TechService) {
        this.id = model.id;
        this.date = model.date;
        this.dateHuman = model.date ? strftime('%d.%m.%y', model.date) : '';
        this.extContractor = model.ExtContractor ? model.ExtContractor.name : undefined;
        this.extContractorId = model.extContractorId ? model.extContractorId : undefined;
        this.contractor = model.Contractor ? getContractorNameOrThrow(model.Contractor) : undefined;
        this.contractorId = model.contractorId ? model.contractorId : undefined;
        this.sum = model.sum;
        this.countEquipment = model.countEquipment;
        this.comment = model.comment;
    }
}
