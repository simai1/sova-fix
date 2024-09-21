import catchAsync from '../utils/catchAsync';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';
import extContractorService from '../services/extContractor.service';

const getAll = catchAsync(async (req, res) => {
    const extContractors = await extContractorService.getAllExtContractors();
    res.json(extContractors);
});

const create = catchAsync(async (req, res) => {
    const { name, spec, legalForm } = req.body;
    if (!name) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing name');
    if (!spec) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing spec');
    if (!legalForm) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing legalForm');
    const extContractor = await extContractorService.createExtContractor(name, spec, legalForm);
    res.json(extContractor);
});

const getOne = catchAsync(async (req, res) => {
    const { extContractorId } = req.params;
    if (!extContractorId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing id');
    const extContractor = await extContractorService.getOneExtContractor(extContractorId);
    res.json(extContractor);
});

const destroy = catchAsync(async (req, res) => {
    const { extContractorId } = req.params;
    if (!extContractorId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing id');
    await extContractorService.destroyExtContractor(extContractorId);
    res.json({ status: 'OK' });
});

const update = catchAsync(async (req, res) => {
    const { extContractorId } = req.params;
    const { name, spec, legalForm } = req.body;
    if (!extContractorId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing id');
    const extContractor = await extContractorService.updateExtContractor(extContractorId, name, spec, legalForm);
    res.json(extContractor);
});

export default {
    getAll,
    create,
    getOne,
    destroy,
    update,
};
