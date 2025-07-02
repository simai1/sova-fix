import { SettingsDto } from "../dtos/settings.dto";
import Settings from "../models/settings"


const getAllSettings = async () => {
    const settings = await Settings.findAll()
    return settings.map(o => new SettingsDto(o));
}

export default {
    getAllSettings,
}