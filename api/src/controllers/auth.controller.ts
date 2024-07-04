import catchAsync from "../utils/catchAsync";
import authService from "../services/auth.service";
import ApiError from "../utils/ApiError";
import httpStatus from "http-status";


const registerViaEmail = catchAsync(async (req, res) => {
    const {login} = req.body;
    const userDto = await authService.register(login);
    res.json(userDto);
});

const login = catchAsync(async (req, res) => {
    const {login, password} = req.body;
    const userData = await authService.login(login, password);
    if (userData.user.isActivated) {
        res.cookie('refreshToken', userData.refreshToken, {maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true});
        res.json(userData);
    } else res.redirect(`/activate/${userData.user.id}`);
});

const activate = catchAsync(async (req, res) => {
    const {password} = req.body;
    const {userId} = req.params;
    const userData = await authService.activate(password, userId);
    res.cookie('refreshToken', userData.refreshToken, {maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true});
    res.json(userData);
});

export default {
    registerViaEmail,
    login,
    activate,
};
