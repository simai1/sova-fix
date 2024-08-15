import User from '../models/user';
import UserDto from '../dtos/user.dto';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';
import generator from 'generate-password';
import sendMail from './email.service';

import userService from './user.service';
import jwtUtils from '../utils/jwt';
import { encryptPassword, isPasswordMatch } from '../utils/encryption';

type data = {
    accessToken: string;
    refreshToken: string;
    user: UserDto;
};
const register = async (login: string): Promise<UserDto> => {
    const checkUser = await userService.getUserByEmail(login);
    if (checkUser) throw new ApiError(httpStatus.BAD_REQUEST, 'User with this email already exists');

    const password = generator.generate({
        length: 10,
        numbers: true,
    });

    const encryptedPassword = await encryptPassword(password);
    const user = await User.create({
        login,
        password: encryptedPassword,
    });

    sendMail(login, 'registration', password, `${process.env.WEB_URL}`);
    return new UserDto(user);
};

const login = async (email: string, password: string): Promise<data> => {
    const user = await userService.getUserByEmail(email);
    if (!user || !(await isPasswordMatch(password, user.password)))
        throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid login data');

    const userDto = new UserDto(user);
    const { accessToken, refreshToken } = jwtUtils.generate({ ...userDto });
    await jwtUtils.saveToken(userDto.id, refreshToken);
    return {
        accessToken: accessToken,
        refreshToken: refreshToken,
        user: userDto,
    };
};

const activate = async (password: string, name: string, userId: string): Promise<data> => {
    const user = await userService.getUserById(userId);
    if (!user) throw new ApiError(httpStatus.BAD_REQUEST, 'User doesnt exists');
    if (user.isActivated) throw new ApiError(httpStatus.BAD_REQUEST, 'User already activated');

    const encryptedPassword = await encryptPassword(password);
    await user.update({ isActivated: true, password: encryptedPassword, name });
    const userDto = new UserDto(user);
    const { accessToken, refreshToken } = jwtUtils.generate({ ...userDto });
    await jwtUtils.saveToken(userDto.id, refreshToken);
    return {
        accessToken: accessToken,
        refreshToken: refreshToken,
        user: userDto,
    };
};

const logout = async (refreshToken: string): Promise<void> => {
    await jwtUtils.removeToken(refreshToken);
};

const refresh = async (refreshToken: string): Promise<data> => {
    return await jwtUtils.refresh(refreshToken);
};

export default {
    register,
    login,
    activate,
    logout,
    refresh,
};
