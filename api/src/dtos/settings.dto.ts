import Settings from "../models/settings"


export class SettingsDto {
    id!: string
    name!: string
    value!: boolean
    setting!: string

    constructor(model: Settings) {
        this.id = model.id;
        this.name = model.name;
        this.setting = model.setting;
        this.value = model.value;
    }
}