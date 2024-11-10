import RepairRequest from '../models/repairRequest';
import ContractorDto from './contractor.dto';
import strftime from 'strftime';
import ExtContractorDto from './extContractor.dto';

export default class RequestDto {
    id!: string;
    number!: number;
    status!: number;
    unit?: string;
    builder!: string;
    object?: string;
    objectId?: string;
    problemDescription?: string;
    urgency!: string;
    fileName!: string;
    commentAttachment?: string;
    itineraryOrder?: number;
    planCompleteDate?: string;
    planCompleteDateRaw?: Date;
    completeDate?: string;
    completeDateRaw?: Date;
    repairPrice?: number;
    comment?: string;
    checkPhoto?: string;
    legalEntity?: string;
    daysAtWork!: number;
    createdAt!: string;
    createdAtRaw?: Date;
    contractor?: ContractorDto | null;
    extContractor?: ExtContractorDto | null;
    isExternal!: boolean;

    constructor(model: RepairRequest) {
        this.id = model.id;
        this.number = model.number;
        this.status = model.status;
        this.unit = model.Unit ? model.Unit.name : undefined;
        this.builder = model.builder;
        this.object = model.Object ? model.Object.name : undefined;
        this.objectId = model.objectId;
        this.problemDescription = model.problemDescription;
        this.urgency = model.urgency;
        this.itineraryOrder = model.itineraryOrder;
        this.planCompleteDate = model.planCompleteDate ? strftime('%d.%m.%y', model.planCompleteDate) : '';
        this.planCompleteDateRaw = model.planCompleteDate;
        this.completeDate = model.completeDate ? strftime('%d.%m.%y', model.completeDate) : '';
        this.completeDateRaw = model.completeDate;
        this.repairPrice = model.repairPrice;
        this.comment = model.comment;
        this.commentAttachment = model.commentAttachment;
        this.legalEntity = model.LegalEntity ? model.LegalEntity.name : undefined;
        this.daysAtWork = model.daysAtWork;
        this.fileName = model.fileName;
        this.checkPhoto = model.checkPhoto;
        this.createdAt = model.createdAt ? strftime('%d.%m.%y', model.createdAt) : '';
        this.createdAtRaw = model.createdAt;
        this.contractor = model.Contractor ? new ContractorDto(model.Contractor) : null;
        this.extContractor = model.ExtContractor ? new ExtContractorDto(model.ExtContractor) : null;
        this.isExternal = model.isExternal;
    }
}
