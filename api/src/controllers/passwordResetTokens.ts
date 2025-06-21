import httpStatus from 'http-status';
import catchAsync from '../utils/catchAsync';
import ApiError from '../utils/ApiError';
import passwordResetTokens from '../services/passwordResetTokens';

const sendRequestToResetPassword = catchAsync(async (req, res) => {
    const { email } = req.body;
    if (!email) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing email');
    await passwordResetTokens.sendRequestToResetPassword(email);

    res.json({ status: 'OK' });
});

const resetPassword = catchAsync(async (req, res) => {
    const { tokenId } = req.params;
    const { token, newPassword } = req.body;

    if (!tokenId || !token || !newPassword) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Missing required fields');
    }

    await passwordResetTokens.resetPassword(tokenId, token, newPassword);

    res.json({ status: 'OK' });
});

export default {
    sendRequestToResetPassword,
    resetPassword,
};
