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
    const { supportFrequency, name, lastTO, nextTO, comment, categoryName, objectId, contractorId, extContractorId } =
        req.body;
    const photo = req.file?.filename;
    if (!name) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing name');
    if (!nextTO) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing nextTO');
    if (!objectId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing objectId');
    if (!categoryName) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing categoryName');
    if (!contractorId && !extContractorId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing contractors');
    if (contractorId && extContractorId) throw new ApiError(httpStatus.BAD_REQUEST, 'Required only one contractor');
    const equipment = await equipmentService.create(
        supportFrequency,
        name,
        lastTO,
        nextTO,
        comment,
        categoryName,
        objectId,
        contractorId,
        extContractorId,
        photo
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
    const { supportFrequency, name, lastTO, nextTO, comment, categoryName, objectId, contractorId, extContractorId } =
        req.body;
    if (contractorId && extContractorId) throw new ApiError(httpStatus.BAD_REQUEST, 'Required only one contractor');
    await equipmentService.update(
        equipmentId,
        supportFrequency,
        name,
        lastTO,
        nextTO,
        comment,
        photo,
        categoryName,
        objectId,
        contractorId,
        extContractorId
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
