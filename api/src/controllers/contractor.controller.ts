import catchAsync from '../utils/catchAsync';
import contractorService from '../services/contractor.service';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';

const getAll = catchAsync(async (req, res) => {
    const contractors = await contractorService.getAllContractors();
    res.json(contractors);
});

const create = catchAsync(async (req, res) => {
    const { name } = req.body;
    if (!name) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing name');
    const contractor = await contractorService.createContractor(name);
    res.json(contractor);
});

const getContractorsRequests = catchAsync(async (req, res) => {
    const { contractorId } = req.params;
    if (!contractorId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing contractorId');
    const requests = await contractorService.getContractorsRequests(contractorId);
    res.json(requests);
});

export default {
    getAll,
    create,
    getContractorsRequests,
};
