import Equipment from '../models/equipment';
import strftime from 'strftime';

export default class EquipmentDto {
    id!: string;
    number!: number;
    name?: string;
    supportFrequency!: number;
    lastTO!: Date;
    lastTOHuman!: string;
    nextTO!: Date;
    nextTOHuman!: string;
    comment?: string;
    photo?: string;
    category?: string;
    unit?: string | null;
    object?: string | undefined;
    contractor?: string;
    extContractor?: string;

    constructor(model: Equipment) {
        this.id = model.id;
        this.number = model.number;
        this.supportFrequency = model.supportFrequency;
        this.lastTO = model.lastTO;
        this.lastTOHuman = strftime('%d.%m.%y', model.lastTO);
        this.nextTO = model.nextTO;
        this.nextTOHuman = strftime('%d.%m.%y', model.nextTO);
        this.photo = model.photo;
        this.category = model.Nomenclature?.Category?.name;
        this.unit = model.Object?.Unit?.name;
        this.object = model.Object?.name;
        this.contractor = model.Contractor?.name;
        this.extContractor = model.ExtContractor?.name;
        this.name = model.Nomenclature?.name;
        this.comment = model.Nomenclature?.comment;
    }
}
