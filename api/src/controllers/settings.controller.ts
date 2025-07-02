import httpStatus from 'http-status';
import settingsService from '../services/settings.service';
import ApiError from '../utils/ApiError';
import catchAsync from '../utils/catchAsync';

const getAllSettings = catchAsync(async (req, res) => {
    const settings = await settingsService.getAllSettings();
    res.json(settings);
});

const changeSettings = catchAsync(async (req, res) => {
    const { settingId } = req.params
    const { value } = req.body;
    if (!settingId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing id');
    if (value === undefined || value === null) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing value');
    await settingsService.changeSetting(settingId, value)
    res.json({status: 'OK'})
});

const getSettingByName = catchAsync(async (req, res) => {
    const {settingName} = req.params
    if (!settingName) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing settingName');
    const setting = await settingsService.getSettingByName(settingName)
    res.json(setting)
})

export default {
    getAllSettings,
    changeSettings,
    getSettingByName,
};
