import ObjectDir from '../models/object';
import UnitDto from './unit.dto';
import LegalEntityDto from './legalEntity.dto';

export default class ObjectDto {
    id!: string;
    number!: number;
    name!: string;
    city!: string;
    unit?: UnitDto;
    legalEntity?: LegalEntityDto;
    budgetPlan?: number; 

    constructor(model: ObjectDir) {
        this.id = model.id;
        this.number = model.number;
        this.name = model.name;
        this.city = model.city;
        this.unit = model.Unit ? new UnitDto(model.Unit) : undefined;
        this.legalEntity = model.LegalEntity ? new LegalEntityDto(model.LegalEntity) : undefined;
        this.budgetPlan = model.budgetPlan
    }
}
