import directoryCategoryService from '../services/directoryCategory.service';
import catchAsync from '../utils/catchAsync';

const getAllDirectoryCategory = catchAsync(async (req, res) => {
    const directoryCategories = await directoryCategoryService.getAllDirectoryCategory();
    return res.json(directoryCategories);
});

export default {
    getAllDirectoryCategory,
};
