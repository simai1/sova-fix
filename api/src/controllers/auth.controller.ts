import catchAsync from '../utils/catchAsync';
import authService from '../services/auth.service';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';

// Cookie с refreshToken — главный auth-носитель: HttpOnly запрещает JS-доступ
// (XSS-mitigation), Secure включён только в проде (в dev по http браузер не пошлёт),
// SameSite=Lax защищает от базового CSRF, оставляя топ-навигацию рабочей.
const refreshCookieOptions = {
    maxAge: 30 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
};

const registerViaEmail = catchAsync(async (req, res) => {
    const { login } = req.body;
    const userDto = await authService.register(login);
    res.json(userDto);
});

const login = catchAsync(async (req, res) => {
    const { login, password } = req.body;
    const userData = await authService.login(login, password);
    if (userData.user.isActivated) {
        res.cookie('refreshToken', userData.refreshToken, refreshCookieOptions);
        res.json(userData);
    } else res.json({ userId: userData.user.id });
});

const activate = catchAsync(async (req, res) => {
    const { password, name } = req.body;
    const { userId } = req.params;
    if (!password) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing password');
    if (!name) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing name');
    const userData = await authService.activate(password, name, userId);
    res.cookie('refreshToken', userData.refreshToken, refreshCookieOptions);
    res.json(userData);
});

const logout = catchAsync(async (req, res) => {
    const { refreshToken } = req.cookies;
    await authService.logout(refreshToken);
    // clearCookie должен совпадать по флагам с set-cookie, иначе браузер
    // не считает его той же cookie и Secure-cookie остаётся живой.
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
    res.cookie('refreshToken', data.refreshToken, refreshCookieOptions);
    res.json(data);
});

const registerCustomerCrm = catchAsync(async (req, res) => {
    const { login, user_id } = req.body;
    console.log(typeof user_id, user_id);
    const userDto = await authService.registerCustomerCrm(login, String(user_id));
    res.json(userDto);
});

const registerPublic = catchAsync(async (req, res) => {
    const { login, password, name, role } = req.body;
    const userDto = await authService.registerPublic(login, password, name, role);
    res.status(201).json({
        userId: userDto.id,
        login: userDto.login,
        name: userDto.name,
        role: userDto.role,
    });
});

export default {
    registerViaEmail,
    login,
    activate,
    logout,
    refresh,
    registerCustomerCrm,
    registerPublic,
};
