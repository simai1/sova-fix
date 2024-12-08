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
    const { supportFrequency, lastTO, nextTO, objectId, contractorId, extContractorId, nomenclatureId, count, cost } =
        req.body;
    const photo = req.file?.filename;
    if (!objectId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing objectId');
    if (!nomenclatureId) throw new ApiError(httpStatus.BAD_REQUEST, 'missing nomenclatureId');
    if (!contractorId && !extContractorId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing contractors');
    if (contractorId && extContractorId) throw new ApiError(httpStatus.BAD_REQUEST, 'Required only one contractor');
    const equipment = await equipmentService.create(
        supportFrequency,
        lastTO,
        nextTO,
        objectId,
        contractorId,
        extContractorId,
        photo,
        nomenclatureId,
        count,
        cost
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
    const { supportFrequency, lastTO, nextTO, objectId, contractorId, extContractorId, nomenclatureId, count, cost } =
        req.body;
    if (
        !supportFrequency &&
        !lastTO &&
        !nextTO &&
        !objectId &&
        !contractorId &&
        !extContractorId &&
        !nomenclatureId &&
        !count &&
        !cost
    )
        throw new ApiError(httpStatus.BAD_REQUEST, 'Missing body');
    if (contractorId && extContractorId) throw new ApiError(httpStatus.BAD_REQUEST, 'Required only one contractor');
    await equipmentService.update(
        equipmentId,
        supportFrequency,
        lastTO,
        nextTO,
        undefined,
        objectId,
        contractorId,
        extContractorId,
        nomenclatureId,
        count,
        cost
    );
    res.json({ status: 'ok' });
});

const techServiceDo = catchAsync(async (req, res) => {
    const { equipmentId } = req.params;
    const { date, contractorId, extContractorId } = req.body;
    if (!equipmentId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing equipment');
    if (!date) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing date');
    if (!contractorId && !extContractorId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing (ext)contractor');
    if (contractorId && extContractorId) throw new ApiError(httpStatus.BAD_REQUEST, 'Required only one contractor');
    const techService = await equipmentService.techServiceDo(equipmentId, date, contractorId, extContractorId);
    res.json(techService);
});

export default {
    create,
    getAll,
    getOne,
    destroy,
    updatePhoto,
    update,
    techServiceDo,
};
