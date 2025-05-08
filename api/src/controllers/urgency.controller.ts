import httpStatus from "http-status";
import ApiError from "../utils/ApiError";
import catchAsync from "../utils/catchAsync";
import urgencyService from "../services/urgency.service";


const createNewUrgency = catchAsync(async (req, res) => {
    const { name, color } = req.body
    if (!name) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing name');
    if (!color) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing color');
    const urgency = await urgencyService.createNewUrgency(name, color)

    res.json(urgency)
})

const getAllUrgencies = catchAsync(async (req, res) => {
    const urgencies = await urgencyService.getAllUrgencies()
    res.json(urgencies)
})

const updateUrgency = catchAsync(async (req, res) => {
    const { urgencyId } = req.params
    const { name, color } = req.body
    if (!urgencyId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing id');
    const urgency = await urgencyService.updateUrgency(urgencyId, name, color)

    res.json(urgency)
})

const destroyUrgency = catchAsync(async (req, res) => {
    const { urgencyId } = req.params
    if (!urgencyId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing id');
    await urgencyService.destroyUrgency(urgencyId)
    res.json({ status: 'OK' });
})

export default {
    createNewUrgency,
    getAllUrgencies,
    updateUrgency,
    destroyUrgency,
}