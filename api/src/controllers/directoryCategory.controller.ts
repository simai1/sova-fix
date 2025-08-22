import httpStatus from 'http-status';
import directoryCategoryService from '../services/directoryCategory.service';
import ApiError from '../utils/ApiError';
import catchAsync from '../utils/catchAsync';

const getAllDirectoryCategory = catchAsync(async (req, res) => {
    const directoryCategories = await directoryCategoryService.getAllDirectoryCategory();
    return res.json(directoryCategories);
});

const createDirectoryCategory = catchAsync(async (req, res) => {
    const { name, color, customersIds, builderId, builderExternalId, isExternal, managerId, isManager } = req.body;
    if (!name) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing name');
    if (!color) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing color');
    const createdDirectoryCategory = await directoryCategoryService.createDirectoryCategory(
        name,
        color,
        customersIds,
        builderId,
        builderExternalId,
        isExternal,
        managerId,
        isManager
    );

    return res.json(createdDirectoryCategory);
});

const updateDirectoryCategory = catchAsync(async (req, res) => {
    const { directoryCategoryId } = req.params;
    if (!directoryCategoryId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing directoryCategoryId');
    const { name, color, customersIds, builderId, isExternal, builderExternalId, managerId, isManager } = req.body;
    if (!name) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing name');
    if (!color) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing color');
    const updatedDirectoryCategory = await directoryCategoryService.updateDirectoryCategory(
        directoryCategoryId,
        name,
        color,
        customersIds,
        builderId,
        builderExternalId,
        isExternal,
        managerId,
        isManager
    );

    return res.json(updatedDirectoryCategory);
});

const deleteDirectoryCategory = catchAsync(async (req, res) => {
    const { directoryCategoryId } = req.params;
    if (!directoryCategoryId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing directoryCategoryId');
    await directoryCategoryService.deleteDirectoryCategory(directoryCategoryId);
    res.json({ status: 'OK' });
});

const getAllBuilders = catchAsync(async (req, res) => {
    const allBuilders = await directoryCategoryService.getAllBuilders();
    res.json(allBuilders);
});

const getAllCustomers = catchAsync(async (req, res) => {
    const allCustomers = await directoryCategoryService.getAllCustomers();
    res.json(allCustomers);
});

const getUsersDirectoryCategories = catchAsync(async (req, res) => {
    const { tgId } = req.params;
    if (!tgId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing customerId');
    const customersCategories = await directoryCategoryService.getUsersDirectoryCategories(tgId);
    res.json(customersCategories);
});

export default {
    getAllDirectoryCategory,
    createDirectoryCategory,
    updateDirectoryCategory,
    deleteDirectoryCategory,
    getAllBuilders,
    getAllCustomers,
    getUsersDirectoryCategories,
};
