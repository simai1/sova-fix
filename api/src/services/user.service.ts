import User from '../models/user';
import tokenService from './token.service';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';
import roles from '../config/roles';
import UserDto from '../dtos/user.dto';
import TgUser from '../models/tgUser';

type userDir = {
    id: string;
    isConfirmed: boolean;
    login: string | null | undefined;
    tgId: string | null | undefined;
    tgUserId: string | null | undefined;
    name: string;
    role: number;
};

const getUserById = async (userId: string): Promise<User | null> => {
    return User.findByPk(userId);
};

const getUserByEmail = async (login: string): Promise<User | null> => {
    return User.findOne({ where: { login } });
};

const getUserByRefreshToken = async (refreshToken: string): Promise<User | null> => {
    const token = await tokenService.getTokenByRefreshToken(refreshToken);
    if (!token) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found token');
    return await getUserById(token.userId);
};

const setRole = async (role: number, userId: string): Promise<void> => {
    if (!Object.values(roles).includes(role)) throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid role');
    const user = await getUserById(userId);
    if (!user) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found user');
    await user.update({ role });
};

const getAllUsers = async (): Promise<UserDto[]> => {
    const users = await User.findAll({ order: [['name', 'ASC']] });
    return users.map(u => new UserDto(u));
};

const getUsersDir = async (): Promise<userDir[]> => {
    const users = await User.findAll({ include: [{ model: TgUser }] });
    const tgUsers = await TgUser.findAll();
    const userDirs: userDir[] = [];
    users.forEach(user => {
        userDirs.push({
            id: user.id,
            isConfirmed: user.isActivated,
            login: user.login,
            tgId: user.TgUser?.tgId,
            tgUserId: user.tgManagerId,
            name: user.name,
            role: user.role,
        });
    });
    for (const user of tgUsers) {
        if (!userDirs.some(ud => ud.tgUserId === user.id))
            userDirs.push({
                id: user.id,
                isConfirmed: user.isConfirmed,
                login: null,
                tgUserId: undefined,
                tgId: user.tgId,
                name: user.name,
                role: user.role,
            });
    }
    return userDirs;
};

const deleteUser = async (userId: string): Promise<void> => {
    await User.destroy({ where: { id: userId }, force: true, individualHooks: true });
};

const confirmTgUser = async (userId: string): Promise<void> => {
    const user = await TgUser.findByPk(userId);
    if (!user) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found user with id ' + userId);
    await user.update({ isConfirmed: true });
};

export default {
    getUserById,
    getUserByEmail,
    getUserByRefreshToken,
    setRole,
    getUsersDir,
    getAllUsers,
    deleteUser,
    confirmTgUser,
};
