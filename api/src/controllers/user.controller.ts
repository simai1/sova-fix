import catchAsync from '../utils/catchAsync';
import userService from '../services/user.service';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';
import jwtUtil from '../utils/jwt';

const setRole = catchAsync(async (req, res) => {
    const { role, userId } = req.body;
    if (!role) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing role');
    if (!userId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing userId');
    await userService.setRole(role, userId);
    res.json({ status: 'OK' });
});

const getAll = catchAsync(async (req, res) => {
    const users = await userService.getUsersDir();
    res.json(users);
});

const destroy = catchAsync(async (req, res) => {
    const { userId } = req.params;
    const { refreshToken } = req.cookies;
    const userData: any = jwtUtil.decode(refreshToken);
    if (userData.id === userId) throw new ApiError(httpStatus.BAD_REQUEST, 'Can not self delete');
    await userService.deleteDirUser(userId);
    res.json({ status: 'OK' });
});

const confirmTgUser = catchAsync(async (req, res) => {
    const { userId } = req.params;
    if (!userId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing userId');
    await userService.confirmTgUser(userId);
    res.json({ status: 'OK' });
});

export default {
    setRole,
    getAll,
    destroy,
    confirmTgUser,
};
