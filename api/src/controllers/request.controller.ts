import catchAsync from '../utils/catchAsync';
import requestService from '../services/request.service';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';
import statuses from '../config/statuses';
import pick from '../utils/pick';
import prepare from '../utils/prepare';
import TgUser from '../models/tgUser';
import logger from '../utils/logger';
import { migrateManagerIds, validateManagerIds } from '../utils/migrationUtils';
import Status from '../models/status';

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
            'checkPhoto',
            'isAutoCreated',
            'managerTgId',
            'managerId',
            'exclude_search',
            'exclude_number',
            'exclude_status',
            'exclude_unit',
            'exclude_builder',
            'exclude_object',
            'exclude_problemDescription',
            'exclude_urgency',
            'exclude_itineraryOrder',
            'exclude_repairPrice',
            'exclude_comment',
            'exclude_legalEntity',
            'exclude_daysAtWork',
            'exclude_createdAt',
            'exclude_contractor',
            'exclude_checkPhoto',
            'exclude_directoryCategory',
        ])
    );
    let userId: string | undefined = undefined;
    if (typeof req.query.userId === 'string') {
        userId = req.query.userId;
    }
    const order = prepare(pick(req.query, ['col', 'type']));
    const pagination = prepare(pick(req.query, ['limit', 'offset']));
    if (order.type && ['asc', 'desc'].indexOf(order.type) === -1)
        throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid order type');
    const [requestsDtos, maxCount] = await requestService.getAllRequests(filter, order, pagination, userId);
    res.json({ maxCount, data: requestsDtos });
});

const getOne = catchAsync(async (req, res) => {
    const { requestId } = req.params;
    const requestDto = await requestService.getRequestById(requestId);
    res.json(requestDto);
});

const create = catchAsync(async (req, res) => {
    const { objectId, problemDescription, urgency, repairPrice, comment, tgUserId, directoryCategoryId } = req.body;
    const fileName = req.file?.filename;
    if (!fileName) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing file');
    if (!tgUserId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing tgUserId');
    if (!objectId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing object');
    if (!urgency) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing urgency');
    const tgUser = await TgUser.findByPk(tgUserId);

    if (!tgUser || (tgUser.role !== 3 && tgUser.role !== 2 && tgUser.role !== 1))
        throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid tgUser');
    const requestDto = await requestService.createRequest(
        objectId,
        problemDescription,
        urgency,
        repairPrice,
        comment,
        fileName,
        tgUserId,
        directoryCategoryId
    );
    res.json({ requestDto });
});

const createWithoutPhoto = catchAsync(async (req, res) => {
    const { objectId, problemDescription, urgency, repairPrice, comment, tgUserId, directoryCategoryId } = req.body;
    if (!tgUserId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing tgUserId');
    if (!objectId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing object');
    if (!urgency) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing urgency');
    const tgUser = await TgUser.findByPk(tgUserId);

    if (!tgUser || (tgUser.role !== 3 && tgUser.role !== 2 && tgUser.role !== 1))
        throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid tgUser');
    const requestDto = await requestService.createRequestWithoutPhoto(
        objectId,
        problemDescription,
        urgency,
        repairPrice,
        comment,
        tgUserId,
        directoryCategoryId
    );
    res.json({ requestDto });
});

const createWithMultiplePhotos = catchAsync(async (req, res) => {
    const { objectId, problemDescription, urgency, repairPrice, comment, tgUserId, directoryCategoryId } = req.body;
    const files = (req as any).files as Express.Multer.File[];

    if (!files || files.length === 0) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing files');
    if (!tgUserId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing tgUserId');
    if (!objectId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing object');
    if (!urgency) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing urgency');

    const tgUser = await TgUser.findByPk(tgUserId);

    if (!tgUser || (tgUser.role !== 3 && tgUser.role !== 2 && tgUser.role !== 1))
        throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid tgUser');

    const fileNames = files.map(file => file.filename);

    const requestDto = await requestService.createRequestWithMultiplePhotos(
        objectId,
        problemDescription,
        urgency,
        repairPrice,
        comment,
        fileNames,
        tgUserId,
        directoryCategoryId
    );

    res.json({ requestDto });
});

const setContractor = catchAsync(async (req, res) => {
    const { requestId, contractorId, managerId } = req.body;
    if (!requestId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing requestId');
    if (!contractorId && !managerId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing contractorId or managerId');
    await requestService.setContractor(requestId, contractorId, managerId);
    res.json({ status: 'OK' });
});

const setExtContractor = catchAsync(async (req, res) => {
    const { requestId, extContractorId } = req.body;
    if (!requestId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing requestId');
    if (!extContractorId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing extContractorId');
    await requestService.setExtContractor(requestId, extContractorId);
    res.json({ status: 'OK' });
});

const setComment = catchAsync(async (req, res) => {
    const { requestId, comment } = req.body;
    if (!requestId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing requestId');
    if (!comment) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing comment');
    await requestService.setComment(requestId, comment);
    res.json({ status: 'OK' });
});

const setCommentAttachment = catchAsync(async (req, res) => {
    const { requestId } = req.body;
    const fileName = req.file?.filename;
    if (!fileName) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing file');
    if (!requestId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing requestId');
    const request = await requestService.setCommentAttachment(requestId, fileName);
    res.json(request);
});

const removeContractor = catchAsync(async (req, res) => {
    const { requestId } = req.body;
    if (!requestId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing requestId');
    await requestService.removeContractor(requestId);
    res.json({ status: 'OK' });
});

const removeExtContractor = catchAsync(async (req, res) => {
    const { requestId } = req.body;
    if (!requestId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing requestId');
    await requestService.removeExtContractor(requestId);
    res.json({ status: 'OK' });
});

const setStatus = catchAsync(async (req, res) => {
    const { requestId, status } = req.body;
    if (!requestId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing requestId');
    if (!status) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing status');
    const statusFromDb = await Status.findOne({ where: { number: status } });
    if (!statusFromDb) throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid status');
    await requestService.setStatus(requestId, status, statusFromDb.id);
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
        itineraryOrder,
        contractorId,
        status,
        builder,
        planCompleteDate,
        urgencyId,
        managerTgId,
    } = req.body;
    const { requestId } = req.params;
    if (!requestId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing requestId');

    if (
        !objectId &&
        !problemDescription &&
        !urgency &&
        !repairPrice &&
        !comment &&
        !itineraryOrder &&
        !contractorId &&
        !status &&
        !builder &&
        typeof planCompleteDate === 'undefined' &&
        !managerTgId
    )
        throw new ApiError(httpStatus.BAD_REQUEST, 'Missing body');

    logger.info({
        message: `Updating request ${requestId}`,
        fields: {
            managerTgId,
            status,
            contractorId,
        },
    });

    await requestService.update(
        requestId,
        objectId,
        problemDescription,
        urgency,
        repairPrice,
        comment,
        itineraryOrder,
        contractorId,
        status,
        builder,
        planCompleteDate,
        urgencyId,
        managerTgId
    );
    res.json({ status: 'OK' });
});

const getCustomersRequests = catchAsync(async (req, res) => {
    const { tgUserId } = req.params;
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
            'checkPhoto',
        ])
    );

    if (!tgUserId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing tgUserId');
    const requestsDtos = await requestService.getCustomersRequests(tgUserId, filter);
    res.json(requestsDtos);
});

const getRequestsByObjects = catchAsync(async (req, res) => {
    const { tgUserId } = req.params;
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
            'checkPhoto',
        ])
    );

    if (!tgUserId) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Missing tgUserId');
    }

    try {
        const requestsDtos = await requestService.getRequestsByObjects(tgUserId, filter);
        res.json(requestsDtos);
    } catch (error) {
        console.error('Error getting requests by objects:', error);
        throw error;
    }
});

const addCheck = catchAsync(async (req, res) => {
    const { requestId } = req.params;
    const fileName = req.file?.filename;
    if (!requestId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing requestId');
    if (!fileName) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing file');
    await requestService.addCheck(requestId, fileName);
    res.json({ status: 'OK' });
});

const bulkDelete = catchAsync(async (req, res) => {
    const { ids } = req.body;
    if (!ids) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing ids');
    if (typeof ids !== 'object') throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid ids');
    await requestService.bulkDeleteRequests(ids);
    res.json({ status: 'OK' });
});

const bulkStatus = catchAsync(async (req, res) => {
    const { ids, status } = req.body;
    if (!ids) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing ids');
    if (!status) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing status');
    if (typeof ids !== 'object') throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid ids');
    await requestService.bulkSetStatus(ids, status);
    res.json({ status: 'OK' });
});

const bulkUrgency = catchAsync(async (req, res) => {
    const { ids, urgency } = req.body;
    if (!ids) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing ids');
    if (!urgency) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing urgency');
    if (typeof ids !== 'object') throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid ids');
    await requestService.bulkSetUrgency(ids, urgency);
    res.json({ status: 'OK' });
});

const bulkContractor = catchAsync(async (req, res) => {
    const { ids, contractorId } = req.body;
    if (!ids) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing ids');
    if (!contractorId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing contractorId');
    if (typeof ids !== 'object') throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid ids');
    await requestService.bulkSetContractor(ids, contractorId);
    res.json({ status: 'OK' });
});

const copy = catchAsync(async (req, res) => {
    const { requestId } = req.params;
    if (!requestId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing requestId');
    await requestService.copyRequest(requestId);
    res.json({ status: 'OK' });
});

const getStat = catchAsync(async (req, res) => {
    const [requests] = await requestService.getAllRequests({}, {}, {});

    if (!Array.isArray(requests)) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to get requests');
    }

    const data = {
        NEW_REQUEST: requests.reduce((acc: number, r: any) => (r.status === 1 ? acc + 1 : acc), 0),
        AT_WORK: requests.reduce((acc: number, r: any) => (r.status === 2 ? acc + 1 : acc), 0),
        DONE: requests.reduce((acc: number, r: any) => (r.status === 3 ? acc + 1 : acc), 0),
    };
    res.json(data);
});

const changeUrgency = catchAsync(async (req, res) => {
    const { prevName, urgencyId } = req.body;
    if (!prevName || !urgencyId) throw new ApiError(httpStatus.BAD_REQUEST, 'missing prevName or urgencyId');
    await requestService.changeUrgency(prevName, urgencyId);
    res.json({ status: 'OK' });
});

const setManager = catchAsync(async (req, res) => {
    const { requestId, managerId } = req.body;
    if (!requestId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing requestId');
    if (!managerId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing managerId');
    await requestService.setManager(requestId, managerId);
    res.json({ status: 'OK' });
});

const migrateManagerData = catchAsync(async (req, res) => {
    await migrateManagerIds();
    res.json({ status: 'OK', message: 'Manager ID migration completed' });
});

const validateManagerData = catchAsync(async (req, res) => {
    await validateManagerIds();
    res.json({ status: 'OK', message: 'Manager ID validation completed' });
});

const changeStatus = catchAsync(async (req, res) => {
    const { prevNumber, statusId } = req.body;
    if (!prevNumber || !statusId) throw new ApiError(httpStatus.BAD_REQUEST, 'missing prevName or statusId');
    await requestService.changeStatus(prevNumber, statusId);
    res.json({ status: 'OK' });
});

const setNewDirectoryCategory = catchAsync(async (req, res) => {
    const { requestId } = req.params;
    const { directoryCategoryId } = req.body;
    if (!requestId) throw new ApiError(httpStatus.BAD_REQUEST, 'missing requestId');
    if (!directoryCategoryId) throw new ApiError(httpStatus.BAD_REQUEST, 'missing directoryCategoryId');

    await requestService.setNewDirectoryCategory(requestId, directoryCategoryId);
    res.json({ status: 'OK' });
});

const getCountFilesRequest = catchAsync(async (req, res) => {
    const { requestId } = req.params;
    if (!requestId) throw new ApiError(httpStatus.BAD_REQUEST, 'missing requestId');
    const count = await requestService.countOfRepairRequest(requestId);
    res.json({ count });
});

const getActualRequestsByObjectId = catchAsync(async (req, res) => {
    const { tgUserId, unitId, objectId } = req.params;

    if (!tgUserId) throw new ApiError(httpStatus.BAD_REQUEST, 'missing tgUserId');
    if (!unitId) throw new ApiError(httpStatus.BAD_REQUEST, 'missing unitId');

    const requests = await requestService.getActualRequestsByObjectId(tgUserId, unitId, objectId);
    res.json({ requests });
});

export default {
    getAll,
    getOne,
    getCustomersRequests,
    getRequestsByObjects,
    create,
    createWithoutPhoto,
    createWithMultiplePhotos,
    setContractor,
    setExtContractor,
    setStatus,
    setComment,
    setCommentAttachment,
    removeExtContractor,
    removeContractor,
    deleteRequest,
    update,
    addCheck,
    bulkDelete,
    bulkStatus,
    bulkUrgency,
    bulkContractor,
    copy,
    getStat,
    changeUrgency,
    setManager,
    migrateManagerData,
    validateManagerData,
    changeStatus,
    getCountFilesRequest,
    setNewDirectoryCategory,
    getActualRequestsByObjectId,
};
