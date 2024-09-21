import Unit from '../models/unit';

export default class UnitDto {
    id!: string;
    number!: number;
    name!: string;
    count!: number;
    description?: string;

    constructor(model: Unit) {
        this.id = model.id;
        this.number = model.number;
        this.name = model.name;
        this.count = model.count;
        this.description = model.description;
    }
}
