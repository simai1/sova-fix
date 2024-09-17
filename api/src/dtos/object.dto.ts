import ObjectDir from '../models/object';
import UnitDto from './unit.dto';

export default class ObjectDto {
    id!: string;
    number!: number;
    name!: string;
    unit!: UnitDto;

    constructor(model: ObjectDir) {
        this.id = model.id;
        this.number = model.number;
        this.name = model.name;
        this.unit = new UnitDto(model.Unit);
    }
}
