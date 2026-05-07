import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import User from '../../src/models/user';
import UserObject from '../../src/models/userObject';
import ObjectDir from '../../src/models/object';
import LegalEntity from '../../src/models/legalEntity';
import Unit from '../../src/models/unit';

describe('UserObject model', () => {
    let userId: string;
    let objectId: string;
    let secondObjectId: string;
    const cleanupLogins = ['userObj@t.local'];

    beforeEach(async () => {
        for (const login of cleanupLogins) {
            const u = await User.findOne({ where: { login } });
            if (u) {
                await UserObject.destroy({ where: { userId: u.id }, force: true });
                await User.destroy({ where: { id: u.id }, force: true });
            }
        }

        // beforeCreate-хук считает `number`, но валидация бьётся раньше — даём `number: 0`.
        let legal = await LegalEntity.findOne({ where: { name: 'UO Test LE' } });
        if (!legal)
            legal = await LegalEntity.create({
                name: 'UO Test LE',
                legalForm: 'ООО',
                startCoop: new Date(),
                count: 0,
                number: 0,
            } as any);
        let unit = await Unit.findOne({ where: { name: 'UO Test Unit' } });
        if (!unit) unit = await Unit.create({ name: 'UO Test Unit', count: 0, number: 0 } as any);

        const u = await User.create({
            login: 'userObj@t.local',
            password: 'x',
            name: 'UO Test',
            role: 3,
            isActivated: true,
        } as any);
        userId = u.id;

        const o1 = await ObjectDir.create({
            name: `UO Obj 1 ${u.id.slice(0, 6)}`,
            unitId: unit.id,
            legalEntityId: legal.id,
            city: 'Москва',
            number: 0,
        } as any);
        const o2 = await ObjectDir.create({
            name: `UO Obj 2 ${u.id.slice(0, 6)}`,
            unitId: unit.id,
            legalEntityId: legal.id,
            city: 'Москва',
            number: 0,
        } as any);
        objectId = o1.id;
        secondObjectId = o2.id;
    });

    afterAll(async () => {
        for (const login of cleanupLogins) {
            const u = await User.findOne({ where: { login } });
            if (u) {
                await UserObject.destroy({ where: { userId: u.id }, force: true });
                await User.destroy({ where: { id: u.id }, force: true });
            }
        }
    });

    it('создаёт связь User <-> Object', async () => {
        const link = await UserObject.create({ userId, objectId });
        expect(link.id).toBeTruthy();
        expect(link.userId).toBe(userId);
        expect(link.objectId).toBe(objectId);
    });

    it('unique индекс не пускает дубликат пары (userId, objectId)', async () => {
        await UserObject.create({ userId, objectId });
        await expect(UserObject.create({ userId, objectId })).rejects.toBeTruthy();
    });

    it('User.belongsToMany(ObjectDir) подгружает связанные объекты', async () => {
        await UserObject.create({ userId, objectId });
        await UserObject.create({ userId, objectId: secondObjectId });
        const u: any = await User.findByPk(userId, { include: [ObjectDir] });
        const ids = (u.Objects || []).map((o: any) => o.id);
        expect(ids).toEqual(expect.arrayContaining([objectId, secondObjectId]));
    });
});
