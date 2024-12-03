import Category from '../models/category';

export default class CategoryDto {
    id!: string;
    name!: string;

    constructor(model: Category) {
        this.id = model.id;
        this.name = model.name;
    }
}
