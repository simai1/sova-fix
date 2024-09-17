import catchAsync from '../utils/catchAsync';
import requestService from '../services/request.service';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';
import statuses from '../config/statuses';
import pick from '../utils/pick';
import prepare from '../utils/prepare';
import TgUser from '../models/tgUser';

const getAll = catchAsync(async (req, res) => {
    const filter = prepare(
        pick(req.query, [
            'search',
            'number',
            'status',
            'unit',
            'builder',
            'object',
            'problemDescription',
            'urgency',
            'itineraryOrder',
            'repairPrice',
            'comment',
            'legalEntity',
            'daysAtWork',
            'createdAt',
            'contractor',
        ])
    );
    const order = prepare(pick(req.query, ['col', 'type']));
    if (order.type && ['asc', 'desc'].indexOf(order.type) === -1)
        throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid order type');
    const requestsDtos = await requestService.getAllRequests(filter, order);
    res.json({ requestsDtos });
});

const getOne = catchAsync(async (req, res) => {
    const { requestId } = req.params;
    const requestDto = await requestService.getRequestById(requestId);
    res.json(requestDto);
});

const create = catchAsync(async (req, res) => {
    const { objectId, problemDescription, urgency, repairPrice, comment, legalEntity, tgUserId } = req.body;
    const fileName = req.file?.filename;
    if (!fileName) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing file');
    if (!tgUserId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing tgUserId');
    if (!objectId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing object');
    if (!urgency) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing urgency');
    const tgUser = await TgUser.findByPk(tgUserId);
    // @ts-expect-error 'tgUser' is possibly 'null'
    if (!tgUser && tgUser.role !== 3) throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid tgUser');
    const requestDto = await requestService.createRequest(
        objectId,
        problemDescription,
        urgency,
        repairPrice,
        comment,
        legalEntity,
        fileName,
        tgUserId
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

const setComment = catchAsync(async (req, res) => {
    const { requestId, comment } = req.body;
    if (!requestId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing requestId');
    if (!comment) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing comment');
    await requestService.setComment(requestId, comment);
    res.json({ status: 'OK' });
});

const removeContractor = catchAsync(async (req, res) => {
    const { requestId } = req.body;
    if (!requestId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing requestId');
    await requestService.removeContractor(requestId);
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
    const {
        objectId,
        problemDescription,
        urgency,
        repairPrice,
        comment,
        legalEntity,
        itineraryOrder,
        contractorId,
        status,
        builder,
    } = req.body;
    const { requestId } = req.params;
    if (!requestId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing requestId');
    if (
        !objectId &&
        !problemDescription &&
        !urgency &&
        !repairPrice &&
        !comment &&
        !legalEntity &&
        !itineraryOrder &&
        !contractorId &&
        !status &&
        !builder
    )
        throw new ApiError(httpStatus.BAD_REQUEST, 'Missing body');
    await requestService.update(
        requestId,
        objectId,
        problemDescription,
        urgency,
        repairPrice,
        comment,
        legalEntity,
        itineraryOrder,
        contractorId,
        status,
        builder
    );
    res.json({ status: 'OK' });
});

const getCustomersRequests = catchAsync(async (req, res) => {
    const { tgUserId } = req.params;
    if (!tgUserId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing tgUserId');
    const requestsDtos = await requestService.getCustomersRequests(tgUserId);
    res.json(requestsDtos);
});

const addCheck = catchAsync(async (req, res) => {
    const { requestId } = req.params;
    const fileName = req.file?.filename;
    if (!requestId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing requestId');
    if (!fileName) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing file');
    await requestService.addCheck(requestId, fileName);
    res.json({ status: 'OK' });
});

export default {
    getAll,
    getOne,
    create,
    setContractor,
    setComment,
    removeContractor,
    setStatus,
    deleteRequest,
    update,
    getCustomersRequests,
    addCheck,
};
