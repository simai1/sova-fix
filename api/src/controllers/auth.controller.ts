import catchAsync from '../utils/catchAsync';
import authService from '../services/auth.service';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';
import roles from '../config/roles';

const buildRefreshCookieOptions = (rememberMe: boolean) => ({
    ...(rememberMe ? { maxAge: 30 * 24 * 60 * 60 * 1000 } : {}),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
});

const registerViaEmail = catchAsync(async (req, res) => {
    const { login, role } = req.body;
    if (typeof role !== 'number' || !Object.values(roles).includes(role)) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Некорректная роль');
    }
    const userDto = await authService.register(login, role);
    res.json(userDto);
});

const login = catchAsync(async (req, res) => {
    const { login, password, rememberMe } = req.body;
    const userData = await authService.login(login, password, Boolean(rememberMe));
    if (userData.user.isActivated) {
        res.cookie('refreshToken', userData.refreshToken, buildRefreshCookieOptions(userData.rememberMe));
        res.json(userData);
    } else res.json({ userId: userData.user.id });
});

const activate = catchAsync(async (req, res) => {
    const { password, name } = req.body;
    const { userId } = req.params;
    if (!password) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing password');
    if (!name) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing name');
    const userData = await authService.activate(password, name, userId);
    res.cookie('refreshToken', userData.refreshToken, buildRefreshCookieOptions(userData.rememberMe));
    res.json(userData);
});

const logout = catchAsync(async (req, res) => {
    const { refreshToken } = req.cookies;
    await authService.logout(refreshToken);
    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
    });
    res.json({ status: 'OK' });
});

const refresh = catchAsync(async (req, res) => {
    const { refreshToken } = req.cookies;
    const data = await authService.refresh(refreshToken);
    res.cookie('refreshToken', data.refreshToken, buildRefreshCookieOptions(Boolean(data.rememberMe)));
    res.json(data);
});

const registerCrmAccess = catchAsync(async (req, res) => {
    const { login, user_id } = req.body;
    const userDto = await authService.registerCrmAccessFromBot(login, String(user_id));
    res.json(userDto);
});

const registerPublic = catchAsync(async (req, res) => {
    const { login, password, name, role } = req.body;
    const result = await authService.registerPublic(login, password, name, role);
    res.status(201).json({
        userId: result.user.id,
        login: result.user.login,
        name: result.user.name,
        role: result.user.role,
        pendingVerifyToken: result.pendingVerifyToken,
        pendingVerifyTokenExpiresAt: result.pendingVerifyTokenExpiresAt.toISOString(),
    });
});

export default {
    registerViaEmail,
    login,
    activate,
    logout,
    refresh,
    registerCrmAccess,
    registerPublic,
};
