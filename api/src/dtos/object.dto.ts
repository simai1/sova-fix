import ObjectDir from '../models/object';
import UnitDto from './unit.dto';

export default class ObjectDto {
    id!: string;
    name!: string;
    unit!: UnitDto;

    constructor(model: ObjectDir) {
        this.id = model.id;
        this.name = model.name;
        this.unit = new UnitDto(model.Unit);
    }
}
