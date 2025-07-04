import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';
import Unit from '../models/unit';
import UnitDto from '../dtos/unit.dto';
import objectService from './object.service';
import ObjectDir from '../models/object';

const setCountUnit = async (unitId: string): Promise<void> => {
    const objects = await objectService.getAllObjects();
    let count = 0;
    objects.forEach(obj => {
        if (obj.unit?.id === unitId) count++;
    });
    await Unit.update({ count }, { where: { id: unitId } });
};

const getUnitById = async (id: string): Promise<Unit | null> => {
    return await Unit.findByPk(id);
};

const getAllUnits = async (): Promise<UnitDto[]> => {
    const units = await Unit.findAll({ order: [['number', 'ASC']] });
    return units.map(o => new UnitDto(o));
};

const createUnit = async (name: string, description: string | undefined): Promise<UnitDto> => {
    const checkUnit = await Unit.findOne({ where: { name } });
    if (checkUnit) throw new ApiError(httpStatus.BAD_REQUEST, 'Already exists unit');
    const unit = await Unit.create({ name, description, number: 1 }, {});
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
    const objectsWithUnit = await ObjectDir.findAll({ where: { unitId: unit.id } })
    if (objectsWithUnit.length > 0) throw new ApiError(httpStatus.BAD_REQUEST, 'This unit has objects')
    await unit.destroy({ force: true });
};

const updateUnit = async (
    unitId: string,
    name: string | undefined,
    description: string | undefined
): Promise<UnitDto> => {
    const checkUnit = await getUnitById(unitId);
    if (!checkUnit) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found unit with id ' + unitId);
    const unit = await checkUnit.update({ name, description });
    return new UnitDto(unit);
};

export default {
    setCountUnit,
    getUnitById,
    getAllUnits,
    createUnit,
    getOneUnit,
    destroyUnit,
    updateUnit,
};
