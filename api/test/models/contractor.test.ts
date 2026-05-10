import { describe, it, expect, beforeEach } from 'vitest';
import User from '../../src/models/user';
import Contractor from '../../src/models/contractor';

describe('Contractor.userId', () => {
    let userId: string;

    beforeEach(async () => {
        await User.destroy({ where: { login: 't_contr@test.local' }, force: true });
        const u = await User.create({
            login: 't_contr@test.local',
            password: 'x',
            name: 'TestC',
            role: 4,
        });
        userId = u.id;
        await Contractor.destroy({ where: { userId }, force: true });
    });

    it('создаёт Contractor с userId без tgUserId', async () => {
        const c = await Contractor.create({ userId });
        expect(c.userId).toBe(userId);
        expect(c.tgUserId).toBeFalsy();
    });

    it('User.hasOne(Contractor) работает', async () => {
        await Contractor.create({ userId });
        const u: any = await User.findByPk(userId, { include: [Contractor] });
        expect(u.Contractor?.userId).toBe(userId);
    });
});
