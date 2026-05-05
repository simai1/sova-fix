import User from '../../src/models/user';
import jwtUtils from '../../src/utils/jwt';
import roles from '../../src/config/roles';

export type TestAdminAuth = {
    user: User;
    accessToken: string;
    refreshToken: string;
    cookie: string[];
    authHeader: string;
};

/**
 * Создаёт админа в БД, генерирует валидные access+refresh токены и сохраняет
 * refreshToken в TokenModel — чтобы middleware verifyRole(ADMIN) (читает
 * refreshToken из cookie и ищет его в БД) считал юзера авторизованным.
 */
export const createAdminAuth = async (login = 'admin@test.local'): Promise<TestAdminAuth> => {
    await User.destroy({ where: { login }, force: true });
    const user = await User.create({
        login,
        password: 'x',
        name: 'Admin',
        role: roles.ADMIN,
        isActivated: true,
    });
    const { accessToken, refreshToken } = jwtUtils.generate({ id: user.id, role: roles.ADMIN });
    await jwtUtils.saveToken(user.id, refreshToken);
    return {
        user,
        accessToken,
        refreshToken,
        cookie: [`refreshToken=${refreshToken}`],
        authHeader: `Bearer ${accessToken}`,
    };
};
