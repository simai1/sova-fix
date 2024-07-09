import catchAsync from '../utils/catchAsync';
import userService from '../services/user.service';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';

const setRole = catchAsync(async (req, res) => {
    const { role, userId } = req.body;
    if (!role) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing role');
    if (!userId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing userId');
    await userService.setRole(role, userId);
    res.json({ status: 'OK' });
});

export default {
    setRole,
};
