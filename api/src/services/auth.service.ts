import crypto from 'crypto';
import User from '../models/user';
import UserDto from '../dtos/user.dto';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';
import generator from 'generate-password';
import sendMail from './email.service';

import userService from './user.service';
import jwtUtils from '../utils/jwt';
import { encrypt, isMatch, needsRehash } from '../utils/encryption';
import tgUserService from './tgUser.service';
import { emitTo } from '../utils/ws';
import roles from '../config/roles';
import wsEvents from '../config/wsEvents';
import logger from '../utils/logger';
import notificationService from './notification.service';

// TTL pending-токена. 24 часа — компромисс: достаточно, чтобы менеджер
// одобрил заявку в течение рабочего дня, но короче, чем web-LK refresh-сессия.
// Токен не secret-уровня (он даёт только право слышать USER_CONFIRM для
// конкретного userId, без действий), поэтому короткий TTL и sha256 (вместо
// bcrypt) достаточны.
const PENDING_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

// sha256 от plain hex-токена. Используется и при выдаче (registerPublic),
// и при handshake-проверке (ws.authenticateSubprotocol).
export const hashPendingToken = (plain: string): string => crypto.createHash('sha256').update(plain).digest('hex');

type data = {
    accessToken: string;
    refreshToken: string;
    rememberMe: boolean;
    user: UserDto;
};
const register = async (login: string, role: number): Promise<UserDto> => {
    const checkUser = await userService.getUserByEmail(login);
    if (checkUser) throw new ApiError(httpStatus.BAD_REQUEST, 'User with this email already exists');

    const password = generator.generate({
        length: 10,
        numbers: true,
    });

    const encryptedPassword = await encrypt(password);
    const user = await User.create({
        login,
        name: '',
        password: encryptedPassword,
        role,
    });

    sendMail(login, 'registration', password, `${process.env.WEB_URL}`);
    return new UserDto(user);
};

const login = async (email: string, password: string, rememberMe = false): Promise<data> => {
    // Единый 401 для всех негативных исходов: иначе разная семантика
    // ответа (401 vs 403) позволяет валидировать существование email.
    const failMessage = 'Неверный логин или пароль';
    const user = await userService.getUserByEmail(email);
    if (!user) {
        logger.info(`[auth.login] fail: no_user email=${email}`);
        throw new ApiError(httpStatus.UNAUTHORIZED, failMessage);
    }
    const passwordOk = await isMatch(password, user.password);
    if (!passwordOk) {
        logger.info(`[auth.login] fail: bad_password userId=${user.id}`);
        throw new ApiError(httpStatus.UNAUTHORIZED, failMessage);
    }
    // Web-self-reg юзер ждёт менеджерское одобрение: `isActivated=false` +
    // `pendingVerifyToken` живой. Возвращаем единый 401 (anti-enumeration F-H2):
    // разная семантика (401 vs 200{userId}) позволяет валидировать существование
    // email через web-self-reg регистрацию. Admin-flow юзеры (`!isActivated`
    // без pendingVerifyToken) обрабатываются в контроллере: им возвращается
    // `{userId}` для перехода на экран ввода email-кода.
    if (!user.isActivated && user.pendingVerifyToken) {
        logger.info(`[auth.login] fail: pending_approval userId=${user.id}`);
        throw new ApiError(httpStatus.UNAUTHORIZED, failMessage);
    }

    // Lazy-rehash: апгрейдим cost старых 8-раундовых хешей до актуального
    // BCRYPT_COST. Делаем после успешной проверки, fire-and-forget по
    // факту успешного login — fail тут не должен ломать сам login.
    if (needsRehash(user.password)) {
        try {
            const upgraded = await encrypt(password);
            await user.update({ password: upgraded });
        } catch (e) {
            logger.warn(`[auth.login] rehash failed userId=${user.id}: ${(e as Error).message}`);
        }
    }

    const userDto = new UserDto(user);
    const { accessToken, refreshToken } = jwtUtils.generate({ ...userDto }, rememberMe);
    await jwtUtils.saveToken(userDto.id, refreshToken);
    return {
        accessToken: accessToken,
        refreshToken: refreshToken,
        rememberMe,
        user: userDto,
    };
};

const activate = async (password: string, name: string, userId: string): Promise<data> => {
    const user = await userService.getUserById(userId);
    if (!user) throw new ApiError(httpStatus.BAD_REQUEST, 'User doesnt exists');
    if (user.isActivated) throw new ApiError(httpStatus.BAD_REQUEST, 'User already activated');
    // Web-self-reg юзер не должен активироваться через email-код: его flow —
    // одобрение менеджером (см. user.service.approveUser). Раньше эта ветка
    // была закрыта неявно через `pendingApproval:true` + `isActivated:true`
    // (вторая ветка валилась как «User already activated»). После объединения
    // флагов нужна явная проверка по `pendingVerifyToken`.
    if (user.pendingVerifyToken) throw new ApiError(httpStatus.BAD_REQUEST, 'User already activated');

    const encryptedPassword = await encrypt(password);
    await user.update({ isActivated: true, password: encryptedPassword, name });
    const userDto = new UserDto(user);
    // activate — финал саморегистрации, пользователь только что задал пароль:
    // дефолтно сессия не запоминается (закрытие браузера = logout), как при
    // обычном login без чекбокса.
    const { accessToken, refreshToken } = jwtUtils.generate({ ...userDto }, false);
    await jwtUtils.saveToken(userDto.id, refreshToken);
    return {
        accessToken: accessToken,
        refreshToken: refreshToken,
        rememberMe: false,
        user: userDto,
    };
};

const logout = async (refreshToken: string): Promise<void> => {
    await jwtUtils.removeToken(refreshToken);
};

const refresh = async (refreshToken: string): Promise<data> => {
    return await jwtUtils.refresh(refreshToken);
};

type RegisterPublicResult = {
    user: UserDto;
    // Plain-токен; уходит наружу ровно один раз — в ответе register-public.
    // Клиент сохраняет его в sessionStorage и использует как subprotocol
    // pending.<token> при ws-handshake до approve.
    pendingVerifyToken: string;
    pendingVerifyTokenExpiresAt: Date;
};

const registerPublic = async (
    login: string,
    password: string,
    name: string,
    role: number
): Promise<RegisterPublicResult> => {
    const checkUser = await userService.getUserByEmail(login);
    if (checkUser) throw new ApiError(httpStatus.BAD_REQUEST, 'Пользователь с такой почтой уже зарегистрирован');

    const encryptedPassword = await encrypt(password);
    // `isActivated: false` — единый флаг ожидания: менеджер должен одобрить
    // (web-self-reg). После approve user.service.approveUser ставит true и
    // обнуляет pending verify-token. Различение web-self-reg vs admin-flow
    // по `pendingVerifyToken !== null` (см. auth.service.login).
    const user = await User.create({
        login,
        name,
        password: encryptedPassword,
        role,
        isActivated: false,
    });

    // Генерим одноразовый pending-токен для ws-аутентификации страницы Pending.jsx.
    // 32 байта randomBytes → 64 hex-символа (~256 бит энтропии). В БД храним
    // только sha256(plain) — plain отдаём клиенту один раз и больше нигде не
    // светим (логи, события — без него).
    const plainToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashPendingToken(plainToken);
    const expiresAt = new Date(Date.now() + PENDING_TOKEN_TTL_MS);
    await user.update({
        pendingVerifyToken: tokenHash,
        pendingVerifyTokenExpiresAt: expiresAt,
    });

    const dto = new UserDto(user);
    // Видят только менеджеры (роль ADMIN), сам pending-юзер ws-сессию не открывает
    // через bearer-канал. Pending.jsx подключается через subprotocol pending.<token>
    // и получает USER_CONFIRM через emitTo({kind:'user'}) после approve.
    emitTo({ kind: 'role', roles: [roles.ADMIN] }, wsEvents.USER_REGISTRATION_REQUEST, { userId: dto.id });

    // Зеркало: тот же триггер уходит в push менеджерам с шаблонным текстом.
    // Имя/email не кладём (PII), но роль кладём в формате UI («Заказчик» /
    // «Исполнитель» / «Менеджер») — без неё менеджер не понимает, кого ждёт.
    await notificationService.notifyRegistrationRequest(role);

    return { user: dto, pendingVerifyToken: plainToken, pendingVerifyTokenExpiresAt: expiresAt };
};

const registerCustomerCrm = async (login: string, tgId: string): Promise<UserDto> => {
    const checkUser = await userService.getUserByEmail(login);
    if (checkUser) throw new ApiError(httpStatus.BAD_REQUEST, 'User with this email already exists');
    const tgUser = await tgUserService.findUserByTgId(tgId);

    const password = generator.generate({
        length: 10,
        numbers: true,
    });

    const encryptedPassword = await encrypt(password);
    const user = await User.create({
        login,
        name: '',
        password: encryptedPassword,
        tgManagerId: tgUser?.id,
        role: 3,
    });

    sendMail(login, 'registration', password, `${process.env.WEB_URL}`);
    return new UserDto(user);
};

export default {
    register,
    login,
    activate,
    logout,
    refresh,
    registerCustomerCrm,
    registerPublic,
};
