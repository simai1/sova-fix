import Status from "../models/status";


export class StatusDto {
    id!: string;
    number!: number;
    name!: string;
    color!: string;
    
    constructor(model: Status) {
        this.color = model.color
        this.id = model.id
        this.number = model.number
        this.name = model.name
    }
}