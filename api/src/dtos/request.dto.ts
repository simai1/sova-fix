import RepairRequest from '../models/repairRequest';
import ContractorDto from './contractor.dto';

export default class RequestDto {
    id!: string;
    number!: number;
    status!: number;
    unit!: string;
    object!: string;
    problemDescription?: string;
    urgency!: string;
    itineraryOrder?: number;
    completeDate?: Date;
    repairPrice?: number;
    comment?: string;
    legalEntity?: string;
    daysAtWork!: number;
    contractor?: ContractorDto | null;

    constructor(model: RepairRequest) {
        this.id = model.id;
        this.number = model.number;
        this.status = model.status;
        this.unit = model.unit;
        this.object = model.object;
        this.problemDescription = model.problemDescription;
        this.urgency = model.urgency;
        this.itineraryOrder = model.itineraryOrder;
        this.completeDate = model.completeDate;
        this.repairPrice = model.repairPrice;
        this.comment = model.comment;
        this.legalEntity = model.legalEntity;
        this.daysAtWork = model.daysAtWork;
        this.contractor = model.Contractor ? new ContractorDto(model.Contractor) : null;
    }
}
