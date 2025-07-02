import settingsService from "../services/settings.service";
import catchAsync from "../utils/catchAsync";


const getAllSettings = catchAsync(async (req, res) => {
    const settings = await settingsService.getAllSettings()
    res.json(settings)
})

export default {
    getAllSettings
}