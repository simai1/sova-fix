import { describe, it, expect, beforeEach } from 'vitest';
import User from '../../src/models/user';
import Contractor from '../../src/models/contractor';
import userService from '../../src/services/user.service';

describe('userService.approveUser', () => {
    let userId: string;

    beforeEach(async () => {
        await Contractor.destroy({ where: { name: 'Approve Test' }, force: true });
        await User.destroy({ where: { login: 'approve@t.local' }, force: true });
        const u = await User.create({
            login: 'approve@t.local',
            password: 'x',
            name: 'Approve Test',
            role: 4,
            isActivated: true,
            pendingApproval: true,
        });
        userId = u.id;
    });

    it('approve CONTRACTOR создаёт Contractor.userId', async () => {
        await userService.approveUser(userId);
        const u = await User.findByPk(userId);
        expect(u?.pendingApproval).toBe(false);
        const c = await Contractor.findOne({ where: { userId } });
        expect(c).not.toBeNull();
        expect(c?.name).toBe('Approve Test');
    });

    it('approve уже approved → ApiError 400', async () => {
        await User.update({ pendingApproval: false }, { where: { id: userId } });
        await expect(userService.approveUser(userId)).rejects.toMatchObject({ statusCode: 400 });
    });

    it('approve не существующего → 404', async () => {
        await expect(
            userService.approveUser('00000000-0000-0000-0000-000000000000')
        ).rejects.toMatchObject({ statusCode: 404 });
    });

    it('approve CUSTOMER не создаёт Contractor', async () => {
        await User.update({ role: 3 }, { where: { id: userId } });
        await userService.approveUser(userId);
        const c = await Contractor.findOne({ where: { userId } });
        expect(c).toBeNull();
    });
});
