import { describe, it, expect } from 'vitest';

import User from '../../src/models/user';
import TgUser from '../../src/models/tgUser';
import Contractor from '../../src/models/contractor';
import UserObject from '../../src/models/userObject';
import TgUserObject from '../../src/models/tgUserObject';
import ObjectDir from '../../src/models/object';
import roles from '../../src/config/roles';
import { ensureBaseRefs } from '../helpers/lk-helper';

// Веб писал доступы в userObjects, бот читал tgUserObjects — после миграции
// 2026-05-11 таблицы разъехались, и у исполнителя в Telegram оставался
// устаревший набор объектов. Бэкфилл должен догнать бота до веба.
describe('migration 2026-09-22-sync-user-objects-to-tg-user-objects', () => {
    const loadMigration = async () => {
        const { sequelize } = await import('../../src/models');
        const { up } = await import('../../src/migrations/2026-09-22-sync-user-objects-to-tg-user-objects');
        return { up, qi: sequelize.getQueryInterface() };
    };

    const createObject = async (name: string): Promise<ObjectDir> => {
        const { legal, unit } = await ensureBaseRefs();
        return await ObjectDir.create({
            name,
            unitId: unit.id,
            legalEntityId: legal.id,
            city: 'Москва',
            number: 0,
        } as any);
    };

    const botObjectIds = async (tgUserId: string): Promise<string[]> => {
        const rows = await TgUserObject.findAll({ where: { tgUserId }, attributes: ['objectId'] });
        return rows.map(r => r.objectId).sort();
    };

    const cleanup = async (userId: string, tgUserId: string, objectIds: string[]) => {
        await TgUserObject.destroy({ where: { tgUserId }, force: true });
        await UserObject.destroy({ where: { userId }, force: true });
        await Contractor.destroy({ where: { userId }, force: true });
        await TgUser.destroy({ where: { id: tgUserId }, force: true });
        await User.destroy({ where: { id: userId }, force: true });
        await ObjectDir.destroy({ where: { id: objectIds }, force: true });
    };

    it('догоняет доступы исполнителя и не плодит дубликаты при повторе', async () => {
        const { up, qi } = await loadMigration();
        const suffix = `${process.pid}-${Date.now()}`;

        const user = await User.create({
            login: `sync-contractor-${suffix}@test.local`,
            password: 'x',
            name: `Sync Contractor ${suffix}`,
            role: roles.CONTRACTOR,
            isActivated: true,
        });
        // У tgUsers собственный диапазон ролей (1..5).
        const tg = await TgUser.create({ name: `sync_c_${suffix}`, role: 4, tgId: `91${suffix}`.slice(0, 15) } as any);
        await Contractor.create({ userId: user.id, tgUserId: tg.id } as any);

        const inBoth = await createObject(`Sync-Both-${suffix}`);
        const onlyWeb = await createObject(`Sync-Web-${suffix}`);
        await UserObject.bulkCreate([
            { userId: user.id, objectId: inBoth.id },
            { userId: user.id, objectId: onlyWeb.id },
        ] as any);
        await TgUserObject.create({ tgUserId: tg.id, objectId: inBoth.id } as any);

        await up({ context: qi });
        await up({ context: qi });

        expect(await botObjectIds(tg.id)).toEqual([inBoth.id, onlyWeb.id].sort());
        expect(await TgUserObject.count({ where: { tgUserId: tg.id, objectId: inBoth.id } })).toBe(1);

        await cleanup(user.id, tg.id, [inBoth.id, onlyWeb.id]);
    });

    it('восстанавливает мягко удалённую связь вместо конфликта по unique-индексу', async () => {
        const { up, qi } = await loadMigration();
        const suffix = `${process.pid}-${Date.now()}`;

        const user = await User.create({
            login: `sync-restore-${suffix}@test.local`,
            password: 'x',
            name: `Sync Restore ${suffix}`,
            role: roles.CONTRACTOR,
            isActivated: true,
        });
        const tg = await TgUser.create({ name: `sync_r_${suffix}`, role: 4, tgId: `92${suffix}`.slice(0, 15) } as any);
        await Contractor.create({ userId: user.id, tgUserId: tg.id } as any);

        const obj = await createObject(`Sync-Restore-${suffix}`);
        await UserObject.create({ userId: user.id, objectId: obj.id } as any);
        const soft = await TgUserObject.create({ tgUserId: tg.id, objectId: obj.id } as any);
        await soft.destroy();

        await up({ context: qi });

        expect(await botObjectIds(tg.id)).toEqual([obj.id]);
        // Именно восстановлена, а не задублирована рядом.
        expect(await TgUserObject.count({ where: { tgUserId: tg.id }, paranoid: false })).toBe(1);

        await cleanup(user.id, tg.id, [obj.id]);
    });

    it('работает для менеджера через users.tgManagerId', async () => {
        const { up, qi } = await loadMigration();
        const suffix = `${process.pid}-${Date.now()}`;

        const tg = await TgUser.create({ name: `sync_m_${suffix}`, role: 2, tgId: `93${suffix}`.slice(0, 15) } as any);
        const user = await User.create({
            login: `sync-manager-${suffix}@test.local`,
            password: 'x',
            name: `Sync Manager ${suffix}`,
            role: roles.MANAGER,
            isActivated: true,
            tgManagerId: tg.id,
        } as any);

        const obj = await createObject(`Sync-Manager-${suffix}`);
        await UserObject.create({ userId: user.id, objectId: obj.id } as any);

        await up({ context: qi });

        expect(await botObjectIds(tg.id)).toEqual([obj.id]);

        await cleanup(user.id, tg.id, [obj.id]);
    });

    it('не трогает отключённого пользователя', async () => {
        const { up, qi } = await loadMigration();
        const suffix = `${process.pid}-${Date.now()}`;

        const user = await User.create({
            login: `sync-disabled-${suffix}@test.local`,
            password: 'x',
            name: `Sync Disabled ${suffix}`,
            role: roles.CONTRACTOR,
            isActivated: true,
            isDisabled: true,
        } as any);
        const tg = await TgUser.create({ name: `sync_d_${suffix}`, role: 4, tgId: `94${suffix}`.slice(0, 15) } as any);
        await Contractor.create({ userId: user.id, tgUserId: tg.id } as any);

        const obj = await createObject(`Sync-Disabled-${suffix}`);
        await UserObject.create({ userId: user.id, objectId: obj.id } as any);

        await up({ context: qi });

        expect(await botObjectIds(tg.id)).toEqual([]);

        await cleanup(user.id, tg.id, [obj.id]);
    });

    it('не снимает доступы, которые есть у бота, но отсутствуют в вебе', async () => {
        const { up, qi } = await loadMigration();
        const suffix = `${process.pid}-${Date.now()}`;

        const user = await User.create({
            login: `sync-extra-${suffix}@test.local`,
            password: 'x',
            name: `Sync Extra ${suffix}`,
            role: roles.CONTRACTOR,
            isActivated: true,
        });
        const tg = await TgUser.create({ name: `sync_e_${suffix}`, role: 4, tgId: `95${suffix}`.slice(0, 15) } as any);
        await Contractor.create({ userId: user.id, tgUserId: tg.id } as any);

        const extra = await createObject(`Sync-Extra-${suffix}`);
        await TgUserObject.create({ tgUserId: tg.id, objectId: extra.id } as any);

        await up({ context: qi });

        // Сужение прав миграцией делать нельзя — такие случаи разбираются руками.
        expect(await botObjectIds(tg.id)).toEqual([extra.id]);

        await cleanup(user.id, tg.id, [extra.id]);
    });
});
