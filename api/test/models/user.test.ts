import { describe, it, expect, beforeEach } from 'vitest';
import User from '../../src/models/user';

describe('User.pendingApproval', () => {
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
        expect(u.pendingApproval).toBe(false);
    });

    it('сохраняет pendingApproval=true', async () => {
        const u = await User.create({
            login: 't_pending@test.local',
            password: 'x',
            name: 'Test',
            role: 3,
            pendingApproval: true,
        });
        expect(u.pendingApproval).toBe(true);
    });
});
