import Equipment from '../models/equipment';
import strftime from 'strftime';
import TechServiceDto from './techService';

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
    count!: number;
    cost!: number;
    avgCost!: number;
    category?: string;
    unit?: string | null;
    object?: string | undefined;
    contractor?: string;
    extContractor?: string;
    history?: object;

    constructor(model: Equipment) {
        this.id = model.id;
        this.number = model.number;
        this.supportFrequency = model.supportFrequency;
        this.lastTO = model.lastTO;
        this.lastTOHuman = strftime('%d.%m.%y', model.lastTO);
        this.nextTO = model.nextTO;
        this.nextTOHuman = strftime('%d.%m.%y', model.nextTO);
        this.photo = model.photo;
        this.count = model.count;
        this.cost = Math.round(model.cost);
        this.avgCost = Math.round(model.cost / model.count);
        this.category = model.Nomenclature?.Category?.name;
        this.unit = model.Object?.Unit?.name;
        this.object = model.Object?.name;
        this.contractor = model.Contractor?.name;
        this.extContractor = model.ExtContractor?.name;
        this.name = model.Nomenclature?.name;
        this.comment = model.Nomenclature?.comment;
        this.history = model.TechServices
            ? // @ts-expect-error operands
              model.TechServices.map(ts => new TechServiceDto(ts)).sort((a, b) => new Date(b.date) - new Date(a.date))
            : undefined;
    }
}
