import httpStatus from 'http-status';
import TgUser from '../models/tgUser';
import User from '../models/user';
import ApiError from './ApiError';

export const resolveTgUser = async (params: { userId?: string; tgUserId?: string }) => {
    const { userId, tgUserId } = params;

    let tgUser;

    if (tgUserId) {
        tgUser = await TgUser.findByPk(tgUserId);
    } else if (userId) {
        const user = await User.findByPk(userId);
        if (!user) throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid User');

        tgUser = await TgUser.findByPk(user.tgManagerId);
    }

    if (!tgUser || ![1, 2, 3].includes(tgUser.role)) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid tgUser');
    }

    return tgUser;
};
