import catchAsync from '../utils/catchAsync';
import authService from '../services/auth.service';

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
    } else res.redirect(`/activate/${userData.user.id}`);
});

const activate = catchAsync(async (req, res) => {
    const { password } = req.body;
    const { userId } = req.params;
    const userData = await authService.activate(password, userId);
    res.cookie('refreshToken', userData.refreshToken, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true });
    res.json(userData);
});

const logout = catchAsync(async (req, res) => {
    const { refreshToken } = req.cookies;
    await authService.logout(refreshToken);
    res.clearCookie('refreshToken');
    res.json({ status: 'OK' });
});

export default {
    registerViaEmail,
    login,
    activate,
    logout,
};
