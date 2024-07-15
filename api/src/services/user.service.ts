import User from '../models/user';
import tokenService from './token.service';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';
import roles from '../config/roles';
import UserDto from '../dtos/user.dto';

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
    const users = await User.findAll();
    return users.map(u => new UserDto(u));
};

const deleteUser = async (userId: string): Promise<void> => {
    await User.destroy({ where: { id: userId }, force: true, individualHooks: true });
};

export default {
    getUserById,
    getUserByEmail,
    getUserByRefreshToken,
    setRole,
    getAllUsers,
    deleteUser,
};
