import httpStatus from 'http-status';
import userService from './user.service';
import ApiError from '../utils/ApiError';
import sendMail from './email.service';
import * as uuid from 'uuid';
import PasswordResetToken from '../models/passwordResetTokens';
import * as bcrypt from 'bcryptjs';
import { Op } from 'sequelize';

const sendRequestToResetPassword = async (email: string) => {
    const user = await userService.getUserByEmail(email);
    if (!user) throw new ApiError(httpStatus.BAD_REQUEST, 'User with email "' + email + '" not found');

    const tokenId = uuid.v4();
    const rawToken = uuid.v4();
    const hashedToken = await bcrypt.hash(rawToken, 10);

    await PasswordResetToken.create({
        id: tokenId,
        userId: user.id,
        token: hashedToken,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 минут
        used: false,
    });

    const link = `${process.env.WEB_URL}/reset-password?tokenId=${tokenId}&token=${rawToken}`;
    sendMail(email, 'resetPassword', link);

    return;
};

const resetPassword = async (tokenId: string, token: string, newPassword: string) => {
    const record = await PasswordResetToken.findOne({
        where: {
            id: tokenId,
            used: false,
            expiresAt: { [Op.gt]: new Date() },
        },
    });

    if (!record || !(await bcrypt.compare(token, record.token))) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Неверный или просроченный токен');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 8);
    await userService.updateUserPassword(record.userId, hashedPassword);

    record.used = true;
    await record.save();

    return;
};

export default {
    sendRequestToResetPassword,
    resetPassword,
};
