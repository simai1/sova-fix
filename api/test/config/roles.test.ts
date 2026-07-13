import { beforeAll, describe, expect, it } from 'vitest';
import roles, { mapRoles, roleNamesRu } from '../../src/config/roles';
import { getRoleUiLabel } from '../../src/config/notificationLabels';
import User from '../../src/models/user';
import UserDto from '../../src/dtos/user.dto';

describe('web role MANAGER', () => {
    beforeAll(async () => {
        await User.destroy({ where: { login: 'manager-role-map@t.local' }, force: true });
    });

    it('имеет стабильный код и отдельные подписи', () => {
        expect(roles.MANAGER).toBe(6);
        expect(mapRoles[roles.ADMIN]).toBe('ADMIN');
        expect(mapRoles[roles.MANAGER]).toBe('MANAGER');
        expect(roleNamesRu[roles.ADMIN]).toBe('Администратор');
        expect(roleNamesRu[roles.MANAGER]).toBe('Менеджер');
        expect(getRoleUiLabel(roles.ADMIN)).toBe('Администратор');
        expect(getRoleUiLabel(roles.MANAGER)).toBe('Менеджер');
    });

    it('сохраняется в User и сериализуется как MANAGER', async () => {
        const user = await User.create({
            login: 'manager-role-map@t.local',
            password: 'x',
            name: 'Manager Role',
            role: roles.MANAGER,
            isActivated: true,
        });
        expect(new UserDto(user).role).toBe('MANAGER');
        await user.destroy({ force: true });
    });
});
