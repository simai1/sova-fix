import { describe, it, expect, afterAll, beforeEach } from 'vitest';
import User from '../../src/models/user';
import Contractor from '../../src/models/contractor';

describe('Contractor.userId', () => {
    let userId: string;

    beforeEach(async () => {
        // Contractor удаляем ДО User: contractors.user_id создаётся ассоциацией
        // belongsTo с ON DELETE SET NULL, поэтому удаление юзера вперёд оставило бы
        // строку без userId и tgUserId — на такой getContractorNameOrThrow бросает
        // исключение, и GET /contractors начинает отдавать 500 остальным сьютам.
        const stale = await User.findOne({ where: { login: 't_contr@test.local' } });
        if (stale) {
            await Contractor.destroy({ where: { userId: stale.id }, force: true });
            await stale.destroy({ force: true });
        }
        const u = await User.create({
            login: 't_contr@test.local',
            password: 'x',
            name: 'TestC',
            role: 4,
        });
        userId = u.id;
    });

    afterAll(async () => {
        const user = await User.findOne({ where: { login: 't_contr@test.local' } });
        if (!user) return;
        await Contractor.destroy({ where: { userId: user.id }, force: true });
        await user.destroy({ force: true });
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
