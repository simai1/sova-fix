import RepairRequest from '../models/repairRequest';
import ContractorDto from './contractor.dto';

export default class RequestDto {
    id!: string;
    number!: number;
    status!: number;
    unit!: string;
    builder!: string;
    object!: string;
    problemDescription?: string;
    urgency!: string;
    fileName!: string;
    itineraryOrder?: number;
    completeDate?: Date;
    repairPrice?: number;
    comment?: string;
    legalEntity?: string;
    daysAtWork!: number;
    createdAt!: Date;
    contractor?: ContractorDto | null;

    constructor(model: RepairRequest) {
        this.id = model.id;
        this.number = model.number;
        this.status = model.status;
        this.unit = model.unit;
        this.builder = model.builder;
        this.object = model.object;
        this.problemDescription = model.problemDescription;
        this.urgency = model.urgency;
        this.itineraryOrder = model.itineraryOrder;
        this.completeDate = model.completeDate;
        this.repairPrice = model.repairPrice;
        this.comment = model.comment;
        this.legalEntity = model.legalEntity;
        this.daysAtWork = model.daysAtWork;
        this.fileName = model.fileName;
        this.createdAt = model.createdAt;
        this.contractor = model.Contractor ? new ContractorDto(model.Contractor) : null;
    }
}
