import Nomenclature from '../models/nomenclature';

export default class NomenclatureDto {
    id!: string;
    name!: string;
    comment?: string;
    category?: string;

    constructor(model: Nomenclature) {
        this.id = model.id;
        this.name = model.name;
        this.comment = model.comment;
        this.category = model.Category?.name;
    }
}
