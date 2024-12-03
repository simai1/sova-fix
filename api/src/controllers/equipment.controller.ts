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
    const { supportFrequency, lastTO, nextTO, objectId, contractorId, extContractorId, nomenclatureId } = req.body;
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
        nomenclatureId
    );
    res.json(equipment);
});

const destroy = catchAsync(async (req, res) => {
    const { equipmentId } = req.params;
    if (!equipmentId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing equipmentId');
    await equipmentService.destroy(equipmentId);
    res.json({ status: 'ok' });
});

const update = catchAsync(async (req, res) => {
    const { equipmentId } = req.params;
    const photo = req.file?.filename;
    const { supportFrequency, lastTO, nextTO, objectId, contractorId, extContractorId, nomenclatureId } = req.body;
    if (
        !photo &&
        !supportFrequency &&
        !lastTO &&
        !nextTO &&
        !objectId &&
        !contractorId &&
        !extContractorId &&
        !nomenclatureId
    )
        throw new ApiError(httpStatus.BAD_REQUEST, 'Missing body');
    if (contractorId && extContractorId) throw new ApiError(httpStatus.BAD_REQUEST, 'Required only one contractor');
    await equipmentService.update(
        equipmentId,
        supportFrequency,
        lastTO,
        nextTO,
        photo,
        objectId,
        contractorId,
        extContractorId,
        nomenclatureId
    );
    res.json({ status: 'ok' });
});

export default {
    create,
    getAll,
    getOne,
    destroy,
    update,
};
