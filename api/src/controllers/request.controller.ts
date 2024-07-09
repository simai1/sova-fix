import catchAsync from '../utils/catchAsync';
import requestService from '../services/request.service';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';

const getAll = catchAsync(async (req, res) => {
    const requestsDtos = requestService.getAllRequests();
    res.json(requestsDtos);
});

const create = catchAsync(async (req, res) => {
    const { unit, object, problemDescription, urgency, repairPrice, comment, legalEntity } = req.body;
    if (!unit) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing unit');
    if (!object) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing object');
    if (!urgency) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing urgency');
    const requestDto = await requestService.createRequest(
        unit,
        object,
        problemDescription,
        urgency,
        repairPrice,
        comment,
        legalEntity
    );
    res.json({ requestDto });
});

export default {
    getAll,
    create,
};
