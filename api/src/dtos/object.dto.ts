import ObjectDir from '../models/object';

export default class ObjectDto {
    id!: string;
    name!: string;

    constructor(model: ObjectDir) {
        this.id = model.id;
        this.name = model.name;
    }
}
