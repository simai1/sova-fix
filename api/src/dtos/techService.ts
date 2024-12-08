import strftime from 'strftime';
import TechService from '../models/techService';

export default class TechServiceDto {
    id!: string;
    date!: Date;
    dateHuman!: string;
    extContractor?: string;
    contractor?: string;
    sum!: number;
    countEquipment!: number;

    constructor(model: TechService) {
        this.id = model.id;
        this.date = model.date;
        this.dateHuman = model.date ? strftime('%d.%m.%y', model.date) : '';
        this.extContractor = model.ExtContractor ? model.ExtContractor.name : undefined;
        this.contractor = model.Contractor ? model.Contractor.name : undefined;
        this.sum = model.sum;
        this.countEquipment = model.countEquipment;
    }
}
