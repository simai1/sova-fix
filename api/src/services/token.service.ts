import TokenModel from '../models/token-model';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';
import userService from './user.service';

const createToken = async (userId: string, refreshToken: string): Promise<TokenModel> => {
    return TokenModel.create({
        userId,
        refreshToken,
    });
};

const getTokenByUserId = async (userId: string): Promise<TokenModel | null> => {
    if (!(await userService.getUserById(userId))) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'User with this id doesnt exists');
    }
    return TokenModel.findOne({
        where: { userId },
    });
};

const updateRefreshToken = async (userId: string, newRefreshToken: string): Promise<void> => {
    await TokenModel.update({ refreshToken: newRefreshToken }, { where: { userId } });
};

const getTokenByRefreshToken = async (refreshToken: string): Promise<TokenModel | null> => {
    return TokenModel.findOne({ where: { refreshToken } });
};

const destroyTokenByRefreshToken = async (refreshToken: string): Promise<void> => {
    const token = await getTokenByRefreshToken(refreshToken);
    await TokenModel.destroy({ where: { id: token?.id } });
};

export default {
    getTokenByUserId,
    updateRefreshToken,
    createToken,
    getTokenByRefreshToken,
    destroyTokenByRefreshToken,
};
