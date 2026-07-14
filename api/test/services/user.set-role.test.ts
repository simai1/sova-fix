import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import roles from '../../src/config/roles';
import User from '../../src/models/user';
import userService from '../../src/services/user.service';
import { cleanupByLogin } from '../helpers/lk-helper';

const roleCases = [
    ['ADMIN', roles.ADMIN],
    ['CUSTOMER', roles.CUSTOMER],
    ['CONTRACTOR', roles.CONTRACTOR],
    ['OBSERVER', roles.OBSERVER],
    ['MANAGER', roles.MANAGER],
] as const;

describe('userService.setRole', () => {
    const adminLogin = 'set-role-service-admin@t.local';
    const managerLogin = 'set-role-service-manager@t.local';
    const targetLogin = 'set-role-service-target@t.local';
    let admin: User;
    let manager: User;
    let target: User;

    beforeAll(async () => {
        for (const login of [adminLogin, managerLogin, targetLogin]) {
            await cleanupByLogin(login);
        }
        admin = await User.create({
            login: adminLogin,
            password: 'x',
            name: 'Set role service admin',
            role: roles.ADMIN,
            isActivated: true,
        });
        manager = await User.create({
            login: managerLogin,
            password: 'x',
            name: 'Set role service manager',
            role: roles.MANAGER,
            isActivated: true,
        });
        target = await User.create({
            login: targetLogin,
            password: 'x',
            name: 'Set role service target',
            role: roles.OBSERVER,
            isActivated: true,
        });
    });

    afterAll(async () => {
        for (const login of [adminLogin, managerLogin, targetLogin]) {
            await cleanupByLogin(login);
        }
    });

    it.each(roleCases)('отклоняет роль %s от MANAGER с 403 без изменения пользователя', async (_roleName, role) => {
        await target.update({ role: roles.OBSERVER });

        await expect(userService.setRole(role, target.id, manager.id)).rejects.toMatchObject({ statusCode: 403 });

        expect((await User.findByPk(target.id))?.role).toBe(roles.OBSERVER);
    });

    it.each(roleCases)('позволяет ADMIN назначить роль %s', async (_roleName, role) => {
        await target.update({ role: roles.OBSERVER });

        await expect(userService.setRole(role, target.id, admin.id)).resolves.toBeUndefined();

        expect((await User.findByPk(target.id))?.role).toBe(role);
    });

    it('сохраняет запрет ADMIN менять собственную роль', async () => {
        await expect(userService.setRole(roles.OBSERVER, admin.id, admin.id)).rejects.toMatchObject({
            statusCode: 400,
        });
        expect((await User.findByPk(admin.id))?.role).toBe(roles.ADMIN);
    });

    it('сохраняет 400 для некорректной роли', async () => {
        await expect(userService.setRole(999, target.id, admin.id)).rejects.toMatchObject({ statusCode: 400 });
    });

    it('сохраняет 404 для отсутствующего пользователя при вызове от ADMIN', async () => {
        await expect(
            userService.setRole(roles.CUSTOMER, '00000000-0000-0000-0000-000000000000', admin.id)
        ).rejects.toMatchObject({ statusCode: 404 });
    });
});
