import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';
import Unit from '../models/unit';
import UnitDto from '../dtos/unit.dto';

const getUnitById = async (id: string): Promise<Unit | null> => {
    return await Unit.findByPk(id);
};

const getAllUnits = async (): Promise<UnitDto[]> => {
    const units = await Unit.findAll();
    return units.map(o => new UnitDto(o));
};

const createUnit = async (name: string, count: number, description: string | undefined): Promise<UnitDto> => {
    const checkUnit = await Unit.findOne({ where: { name } });
    if (checkUnit) throw new ApiError(httpStatus.BAD_REQUEST, 'Already exists unit');
    const unit = await Unit.create({ name, count, description, number: 1 }, {});
    return new UnitDto(unit);
};

const getOneUnit = async (unitId: string): Promise<UnitDto> => {
    const unit = await getUnitById(unitId);
    if (!unit) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found unit with id ' + unitId);
    return new UnitDto(unit);
};

const destroyUnit = async (unitId: string): Promise<void> => {
    const unit = await getUnitById(unitId);
    if (!unit) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found unit with id ' + unitId);
    await unit.destroy();
};

const updateUnit = async (
    unitId: string,
    name: string | undefined,
    count: number | undefined,
    description: string | undefined
): Promise<UnitDto> => {
    const checkUnit = await getUnitById(unitId);
    if (!checkUnit) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found unit with id ' + unitId);
    const unit = await checkUnit.update({ name, count, description });
    return new UnitDto(unit);
};

export default {
    getUnitById,
    getAllUnits,
    createUnit,
    getOneUnit,
    destroyUnit,
    updateUnit,
};
