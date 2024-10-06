import TgUserDto from '../dtos/tgUser.dto';
import TgUser from '../models/tgUser';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';
import Contractor from '../models/contractor';
import userService from './user.service';
import { isMatch } from '../utils/encryption';
import User from '../models/user';
import { sendMsg, WsMsgData } from '../utils/ws';
import { Op } from 'sequelize';

const create = async (name: string, role: number, tgId: string, linkId: string): Promise<TgUserDto> => {
    role = parseInt(String(role));
    const checkUser = await findUserByTgId(tgId);
    if (checkUser) throw new ApiError(httpStatus.BAD_REQUEST, 'Already exists tgUser');
    const user = await TgUser.create({ name, role, tgId, linkId });
    if (role === 4) {
        user.Contractor = await Contractor.create({ name, tgUserId: user.id });
    }
    await user.save();
    sendMsg({
        msg: {
            userId: user.id,
            tgId: tgId,
        },
        event: 'TGUSER_CREATE',
    } as WsMsgData);
    return new TgUserDto(user);
};

const syncManagerToTgUser = async (
    email: string,
    password: string,
    name: string,
    tgId: string,
    linkId: string
): Promise<TgUserDto> => {
    const user = await userService.getUserByEmail(email);
    if (!user || !(await isMatch(password, user.password)))
        throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid login data');
    const tgUser = await TgUser.create({ name, role: 2, isConfirmed: true, tgId, linkId });
    await user.update({ isTgUser: true, tgManagerId: tgUser.id });
    tgUser.User = user;
    await tgUser.save();
    return new TgUserDto(tgUser);
};

const findUserByTgId = async (tgId: string): Promise<TgUserDto | null> => {
    const user = await TgUser.findOne({ where: { tgId }, include: [{ model: Contractor }, { model: User }] });
    return user ? new TgUserDto(user) : null;
};

const getAll = async (): Promise<TgUserDto[]> => {
    const users = await TgUser.findAll({ include: [{ model: Contractor }, { model: User }] });
    return users.map(user => new TgUserDto(user));
};

const getAllManagers = async (): Promise<TgUserDto[]> => {
    const users = await User.findAll({ where: { tgManagerId: { [Op.ne]: null } }, include: [{ model: TgUser }] });
    return users.map(user => new TgUserDto(user.TgUser as TgUser));
};

const getOneUser = async (tgUserId: string): Promise<TgUserDto> => {
    const user = await TgUser.findByPk(tgUserId, { include: [{ model: Contractor }, { model: User }] });
    if (!user) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found tgUser with id ' + tgUserId);
    return new TgUserDto(user);
};

export default {
    create,
    syncManagerToTgUser,
    findUserByTgId,
    getAll,
    getAllManagers,
    getOneUser,
};
