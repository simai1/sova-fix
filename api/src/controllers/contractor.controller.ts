import catchAsync from '../utils/catchAsync';
import contractorService from '../services/contractor.service';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';
import prepare from '../utils/prepare';
import pick from '../utils/pick';

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
    if (!contractorId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing contractorId');
    const requests = await contractorService.getContractorsRequests(contractorId, filter);
    res.json(requests);
});

const getContractorsItinerary = catchAsync(async (req, res) => {
    const { contractorId } = req.params;
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
    if (!contractorId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing contractorId');
    const requests = await contractorService.getContractorsItinerary(contractorId, filter);
    res.json(requests);
});

const getContractorsActualRequests = catchAsync(async (req, res) => {
    const { contractorId, unitId, objectId } = req.params;
    if (!contractorId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing contractorId');
    if (!unitId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing unitId');

    const requests = await contractorService.getContractorsActualRequests(contractorId, unitId, objectId);
    res.json(requests);
});

export default {
    getAll,
    create,
    getContractorsRequests,
    getContractorsItinerary,
    getContractorsActualRequests,
};
