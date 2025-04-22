import LegalEntity from '../models/legalEntity';
import strftime from 'strftime';

export default class LegalEntityDto {
    id!: string;
    number!: number;
    name!: string;
    legalForm!: string;
    count!: number;
    startCoopRaw!: Date;
    startCoop!: string;

    constructor(model: LegalEntity) {
        this.id = model.id;
        this.number = model.number;
        this.name = model.name;
        this.legalForm = model.legalForm;
        this.count = model.count;
        this.startCoopRaw = model.startCoop;
        this.startCoop = model.startCoop ? strftime('%d.%m.%y', model.startCoop) : '';
    }
}
