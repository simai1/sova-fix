import crypto from 'crypto';
import { describe, it, expect, beforeEach } from 'vitest';
import User from '../../src/models/user';
import Contractor from '../../src/models/contractor';
import userService from '../../src/services/user.service';

describe('userService.approveUser', () => {
    let userId: string;

    beforeEach(async () => {
        // Чистим в порядке зависимостей: сначала Contractor (FK на user_id),
        // потом сам User. Имени у Contractor нет (см. models/contractor.ts) —
        // ищем по login через подзапрос.
        const stale = await User.findOne({ where: { login: 'approve@t.local' } });
        if (stale) {
            await Contractor.destroy({ where: { userId: stale.id }, force: true });
            await stale.destroy({ force: true });
        }
        const tokenHash = crypto.createHash('sha256').update('plain-approve-token').digest('hex');
        const u = await User.create({
            login: 'approve@t.local',
            password: 'x',
            name: 'Approve Test',
            role: 4,
            isActivated: false,
            pendingVerifyToken: tokenHash,
            pendingVerifyTokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });
        userId = u.id;
    });

    it('approve CONTRACTOR ставит isActivated=true, обнуляет токен, создаёт Contractor.userId', async () => {
        await userService.approveUser(userId);
        const u = await User.findByPk(userId);
        expect(u?.isActivated).toBe(true);
        expect(u?.pendingVerifyToken).toBeNull();
        expect(u?.pendingVerifyTokenExpiresAt).toBeNull();
        const c = await Contractor.findOne({ where: { userId } });
        expect(c).not.toBeNull();
        expect(c?.userId).toBe(userId);
    });

    it('approve уже approved → ApiError 400', async () => {
        await User.update(
            { isActivated: true, pendingVerifyToken: null, pendingVerifyTokenExpiresAt: null },
            { where: { id: userId } }
        );
        await expect(userService.approveUser(userId)).rejects.toMatchObject({ statusCode: 400 });
    });

    it('approve admin-flow юзера (без pendingVerifyToken) → ApiError 400', async () => {
        // admin-flow ждёт email-кода, не менеджерское одобрение. approveUser
        // не должен на него срабатывать (это другой workflow).
        await User.update({ pendingVerifyToken: null, pendingVerifyTokenExpiresAt: null }, { where: { id: userId } });
        await expect(userService.approveUser(userId)).rejects.toMatchObject({ statusCode: 400 });
    });

    it('approve не существующего → 404', async () => {
        await expect(userService.approveUser('00000000-0000-0000-0000-000000000000')).rejects.toMatchObject({
            statusCode: 404,
        });
    });

    it('approve CUSTOMER не создаёт Contractor', async () => {
        await User.update({ role: 3 }, { where: { id: userId } });
        await userService.approveUser(userId);
        const c = await Contractor.findOne({ where: { userId } });
        expect(c).toBeNull();
    });
});
