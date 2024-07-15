import catchAsync from '../utils/catchAsync';
import authService from '../services/auth.service';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';

const registerViaEmail = catchAsync(async (req, res) => {
    const { login } = req.body;
    const userDto = await authService.register(login);
    res.json(userDto);
});

const login = catchAsync(async (req, res) => {
    const { login, password } = req.body;
    const userData = await authService.login(login, password);
    if (userData.user.isActivated) {
        res.cookie('refreshToken', userData.refreshToken, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true });
        res.json(userData);
    } else res.json({ userId: userData.user.id });
});

const activate = catchAsync(async (req, res) => {
    const { password, name } = req.body;
    const { userId } = req.params;
    if (!password) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing password');
    if (!name) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing name');
    const userData = await authService.activate(password, name, userId);
    res.cookie('refreshToken', userData.refreshToken, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true });
    res.json(userData);
});

const logout = catchAsync(async (req, res) => {
    const { refreshToken } = req.cookies;
    await authService.logout(refreshToken);
    res.clearCookie('refreshToken');
    res.json({ status: 'OK' });
});

const refresh = catchAsync(async (req, res) => {
    const { refreshToken } = req.cookies;
    const data = await authService.refresh(refreshToken);
    res.cookie('refreshToken', data.refreshToken, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true });
    res.json(data);
});

export default {
    registerViaEmail,
    login,
    activate,
    logout,
    refresh,
};
