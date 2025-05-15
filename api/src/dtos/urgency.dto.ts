import { th } from "date-fns/locale";
import Urgency from "../models/urgency";


export class UrgencyDto {
    id!: string;
    number!: number;
    name!: string;
    color!: string;
    
    constructor(model: Urgency) {
        this.color = model.color
        this.id = model.id
        this.number = model.number
        this.name = model.name
    }
}