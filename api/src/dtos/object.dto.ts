import ObjectDir from '../models/object';
import UnitDto from './unit.dto';
import LegalEntityDto from './legalEntity.dto';

export default class ObjectDto {
    id!: string;
    number!: number;
    name!: string;
    city!: string;
    unit!: UnitDto;
    legalEntity!: LegalEntityDto;

    constructor(model: ObjectDir) {
        this.id = model.id;
        this.number = model.number;
        this.name = model.name;
        this.city = model.city;
        this.unit = new UnitDto(model.Unit);
        this.legalEntity = new LegalEntityDto(model.LegalEntity);
    }
}
