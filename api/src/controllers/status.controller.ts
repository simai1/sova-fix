import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync';
import ApiError from '../utils/ApiError';
import statusService from '../services/status.service';

const createNewStatus = catchAsync(async (req, res) => {
    const { name, color } = req.body;
    if (!name) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing name');
    if (!color) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing color');
    const status = await statusService.createNewStatus(name, color);

    res.json(status);
});

const getAllStatuses = catchAsync(async (req, res) => {
    const statuses = await statusService.getAllStatuses();
    res.json(statuses);
});

const updateStatus = catchAsync(async (req, res) => {
    const { statusId } = req.params;
    const { name, color } = req.body;
    if (!statusId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing id');
    const status = await statusService.updateStatus(statusId, name, color);

    res.json(status);
});

const destroyStatus = catchAsync(async (req, res) => {
    const { statusId } = req.params;
    if (!statusId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing id');
    await statusService.destroyStatus(statusId);
    res.json({ status: 'OK' });
});

const getStatusByNumber = catchAsync(async (req, res) => {
    const { statusNumber } = req.params;
    if (!statusNumber) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing number');
    const status = await statusService.getStatusByNumber(statusNumber);
    res.json(status);
});

export default {
    createNewStatus,
    getAllStatuses,
    updateStatus,
    destroyStatus,
    getStatusByNumber,
};
