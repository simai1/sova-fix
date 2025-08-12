import { DirectoryCategoryDto } from '../dtos/directoryCategory.dto';
import DirectoryCategory from '../models/directoryCategory';
import ApiError from '../utils/ApiError';

const getAllDirectoryCategory = async () => {
    const directoryCategory = await DirectoryCategory.findAll({ order: [['number', 'ASC']] });
    return directoryCategory.map(o => new DirectoryCategoryDto(o));
};

export default {
    getAllDirectoryCategory,
};
