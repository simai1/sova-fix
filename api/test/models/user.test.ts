import { describe, it, expect, beforeEach } from 'vitest';
import User from '../../src/models/user';

describe('User.isActivated', () => {
    beforeEach(async () => {
        await User.destroy({ where: { login: 't_pending@test.local' }, force: true });
    });

    it('defaultValue=false для нового User', async () => {
        const u = await User.create({
            login: 't_pending@test.local',
            password: 'x',
            name: 'Test',
            role: 3,
        });
        expect(u.isActivated).toBe(false);
    });

    it('сохраняет isActivated=true', async () => {
        const u = await User.create({
            login: 't_pending@test.local',
            password: 'x',
            name: 'Test',
            role: 3,
            isActivated: true,
        });
        expect(u.isActivated).toBe(true);
    });
});
