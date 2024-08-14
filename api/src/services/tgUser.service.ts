import TgUserDto from '../dtos/tgUser.dto';
import TgUser from '../models/tgUser';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';
import Contractor from '../models/contractor';

const create = async (name: string, role: number, tgId: string): Promise<TgUserDto> => {
    role = parseInt(String(role));
    const checkUser = await findUserByTgId(tgId);
    if (checkUser) throw new ApiError(httpStatus.BAD_REQUEST, 'Already exists tgUser');
    const user = await TgUser.create({ name, role, tgId });
    if (role === 4) {
        user.Contractor = await Contractor.create({ name, tgUserId: user.id });
    }
    await user.save();
    return new TgUserDto(user);
};

const findUserByTgId = async (tgId: string): Promise<TgUserDto | null> => {
    const user = await TgUser.findOne({ where: { tgId }, include: [{ model: Contractor }] });
    return user ? new TgUserDto(user) : null;
};

const getAll = async (): Promise<TgUserDto[]> => {
    const users = await TgUser.findAll({ include: [{ model: Contractor }] });
    return users.map(user => new TgUserDto(user));
};

export default {
    create,
    findUserByTgId,
    getAll,
};
