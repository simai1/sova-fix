import catchAsync from '../utils/catchAsync';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';
import equipmentService from '../services/equipment.service';
import prepare from '../utils/prepare';
import pick from '../utils/pick';

const getAll = catchAsync(async (req, res) => {
    const pagination = prepare(pick(req.query, ['limit', 'offset']));
    const equipments = await equipmentService.getAll(pagination);
    res.json(equipments);
});

const getOne = catchAsync(async (req, res) => {
    const { equipmentId } = req.params;
    if (!equipmentId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing equipmentId');
    const equipment = await equipmentService.getOne(equipmentId);
    res.json(equipment);
});

const create = catchAsync(async (req, res) => {
    const { supportFrequency, lastTO, nextTO, objectId, contractorId, nomenclatureId, count, cost, comment } = req.body;
    const photo = req.file?.filename;
    if (!objectId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing objectId');
    if (!nomenclatureId) throw new ApiError(httpStatus.BAD_REQUEST, 'missing nomenclatureId');
    if (!contractorId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing contractor');
    const equipment = await equipmentService.create(
        supportFrequency,
        lastTO,
        nextTO,
        objectId,
        contractorId,
        photo,
        nomenclatureId,
        count,
        cost,
        comment
    );
    res.json(equipment);
});

const destroy = catchAsync(async (req, res) => {
    const { equipmentId } = req.params;
    if (!equipmentId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing equipmentId');
    await equipmentService.destroy(equipmentId);
    res.json({ status: 'ok' });
});

const updatePhoto = catchAsync(async (req, res) => {
    const { equipmentId } = req.params;
    const fileName = req.file?.filename;
    if (!equipmentId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing equipmentId');
    if (!fileName) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing file');
    await equipmentService.update(
        equipmentId,
        undefined,
        undefined,
        undefined,
        fileName,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined
    );
    res.json({ status: 'ok' });
});

const update = catchAsync(async (req, res) => {
    const { equipmentId } = req.params;
    const { supportFrequency, lastTO, nextTO, objectId, contractorId, nomenclatureId, count, cost, comment } = req.body;
    if (
        !supportFrequency &&
        !lastTO &&
        !nextTO &&
        !objectId &&
        !contractorId &&
        !nomenclatureId &&
        !count &&
        !cost &&
        !comment
    )
        throw new ApiError(httpStatus.BAD_REQUEST, 'Missing body');
    await equipmentService.update(
        equipmentId,
        supportFrequency,
        lastTO,
        nextTO,
        undefined,
        objectId,
        contractorId,
        nomenclatureId,
        count,
        cost,
        comment
    );
    res.json({ status: 'ok' });
});

const techServiceDo = catchAsync(async (req, res) => {
    const { equipmentId } = req.params;
    const { date, contractorId, cost, comment } = req.body;
    if (!equipmentId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing equipment');
    if (!cost) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing cost');
    if (!contractorId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing contractorId');
    if (!date) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing date');
    const techService = await equipmentService.techServiceDo(
        equipmentId,
        new Date(date),
        contractorId,
        Number(cost),
        comment
    );
    res.json(techService);
});

const getQr = catchAsync(async (req, res) => {
    const { equipmentId } = req.params;
    if (!equipmentId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing equipment');
    const qr = await equipmentService.getOrGenerateQrCode(equipmentId);
    res.json(qr);
});

export default {
    create,
    getAll,
    getOne,
    destroy,
    updatePhoto,
    update,
    techServiceDo,
    getQr,
};
