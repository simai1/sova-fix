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

const getUserByTgId = catchAsync(async (req, res) => {
    const { tgId } = req.params;
    if (!tgId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing tgId');
    const user = await userService.getUserByTgId(tgId);
    res.json(user);
});

const getPendingRegistrations = catchAsync(async (req, res) => {
    const list = await userService.getPendingRegistrations();
    res.json(list);
});

const approveUser = catchAsync(async (req, res) => {
    const { userId } = req.params;
    if (!userId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing userId');
    const dto = await userService.approveUser(userId);
    res.json(dto);
});

const setUserObjects = catchAsync(async (req, res) => {
    const { userId } = req.params;
    const { objectIds } = req.body;
    if (!userId) throw new ApiError(httpStatus.BAD_REQUEST, 'Не указан userId');
    if (!Array.isArray(objectIds)) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Поле objectIds должно быть массивом');
    }
    const ids = await userService.setUserObjects(userId, objectIds);
    res.json({ objectIds: ids });
});

const getUserObjects = catchAsync(async (req, res) => {
    const { userId } = req.params;
    if (!userId) throw new ApiError(httpStatus.BAD_REQUEST, 'Не указан userId');
    const ids = await userService.getUserObjects(userId);
    res.json({ objectIds: ids });
});

export default {
    setRole,
    getAll,
    destroy,
    confirmTgUser,
    getUserByTgId,
    getPendingRegistrations,
    approveUser,
    setUserObjects,
    getUserObjects,
};
