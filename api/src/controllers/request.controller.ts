import catchAsync from '../utils/catchAsync';
import requestService from '../services/request.service';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';
import statuses from '../config/statuses';

const getAll = catchAsync(async (req, res) => {
    const requestsDtos = await requestService.getAllRequests();
    res.json({ requestsDtos });
});

const create = catchAsync(async (req, res) => {
    const { unit, object, problemDescription, urgency, repairPrice, comment, legalEntity } = req.body;
    const fileName = req.file?.filename;
    if (!fileName) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing file');
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
        legalEntity,
        fileName
    );
    res.json({ requestDto });
});

const setContractor = catchAsync(async (req, res) => {
    const { requestId, contractorId } = req.body;
    if (!requestId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing requestId');
    if (!contractorId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing contractorId');
    await requestService.setContractor(requestId, contractorId);
    res.json({ status: 'OK' });
});

const setStatus = catchAsync(async (req, res) => {
    const { requestId, status } = req.body;
    if (!requestId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing requestId');
    if (!status) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing status');
    if (!Object.values(statuses).includes(status)) throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid status');
    await requestService.setStatus(requestId, status);
    res.json({ status: 'OK' });
});

const deleteRequest = catchAsync(async (req, res) => {
    const { requestId } = req.params;
    if (!requestId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing requestId');
    await requestService.deleteRequest(requestId);
    res.json({ status: 'OK' });
});

const update = catchAsync(async (req, res) => {
    const { unit, object, problemDescription, urgency, repairPrice, comment, legalEntity, itineraryOrder } = req.body;
    const { requestId } = req.params;
    if (!requestId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing requestId');
    if (
        !unit &&
        !object &&
        !problemDescription &&
        !urgency &&
        !repairPrice &&
        !comment &&
        !legalEntity &&
        !itineraryOrder
    )
        throw new ApiError(httpStatus.BAD_REQUEST, 'Missing body');
    await requestService.update(
        requestId,
        unit,
        object,
        problemDescription,
        urgency,
        repairPrice,
        comment,
        legalEntity,
        itineraryOrder
    );
    res.json({ status: 'OK' });
});

export default {
    getAll,
    create,
    setContractor,
    setStatus,
    deleteRequest,
    update,
};