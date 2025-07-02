import httpStatus from "http-status";
import { SettingsDto } from "../dtos/settings.dto";
import Settings from "../models/settings"
import ApiError from "../utils/ApiError";


const getAllSettings = async () => {
    const settings = await Settings.findAll()
    return settings.map(o => new SettingsDto(o));
}

const changeSetting = async (id: string, value: any) => {
    const setting = await Settings.findByPk(id)
    if (!setting) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found setting with id ' + id);
    const updatedSetting = await setting.update({value})
    return new SettingsDto(updatedSetting)
}

const getSettingByName = async (settingName: string) => {
    const setting = await Settings.findOne({where: {setting: settingName}})
    if (!setting) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found setting with name ' + settingName);
    return new SettingsDto(setting)
}

export default {
    getAllSettings,
    changeSetting,
    getSettingByName,
}