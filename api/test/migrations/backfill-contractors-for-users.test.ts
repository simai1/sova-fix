import { describe, it, expect } from 'vitest';

import Contractor from '../../src/models/contractor';
import User from '../../src/models/user';
import roles from '../../src/config/roles';

// Пользователи с ролью «Исполнитель», созданные через POST /auth/register до
// фикса, остались без строки Contractor: в справочнике пользователей они есть,
// в справочнике исполнителей — нет, назначить заявку невозможно. Их надо
// дозаполнить, иначе чинить придётся руками в БД.
describe('migration 2026-08-25-backfill-contractors-for-users', () => {
    const loadMigration = async () => {
        const { sequelize } = await import('../../src/models');
        const { up } = await import('../../src/migrations/2026-08-25-backfill-contractors-for-users');
        return { up, qi: sequelize.getQueryInterface() };
    };

    it('создаёт недостающие Contractor и не плодит дубликаты при повторе', async () => {
        const { up, qi } = await loadMigration();

        const suffix = `${process.pid}-${Date.now()}`;
        const orphanContractor = await User.create({
            login: `backfill-orphan-${suffix}@test.local`,
            password: 'x',
            name: '',
            role: roles.CONTRACTOR,
        });
        const alreadyLinked = await User.create({
            login: `backfill-linked-${suffix}@test.local`,
            password: 'x',
            name: `Linked ${suffix}`,
            role: roles.CONTRACTOR,
        });
        await Contractor.create({ userId: alreadyLinked.id });
        const customer = await User.create({
            login: `backfill-customer-${suffix}@test.local`,
            password: 'x',
            name: `Customer ${suffix}`,
            role: roles.CUSTOMER,
        });

        await up({ context: qi });
        await up({ context: qi });

        expect(await Contractor.count({ where: { userId: orphanContractor.id } })).toBe(1);
        // Повторный прогон не должен создавать вторую строку — loadUserContext
        // делает findOne и выбрал бы произвольную из них.
        expect(await Contractor.count({ where: { userId: alreadyLinked.id } })).toBe(1);
        // Заказчику строка исполнителя не нужна.
        expect(await Contractor.count({ where: { userId: customer.id } })).toBe(0);

        await Contractor.destroy({ where: { userId: [orphanContractor.id, alreadyLinked.id] }, force: true });
        await User.destroy({ where: { id: [orphanContractor.id, alreadyLinked.id, customer.id] }, force: true });
    });

    it('обходит пользователя с мягко удалённой строкой Contractor', async () => {
        const { up, qi } = await loadMigration();

        const suffix = `${process.pid}-${Date.now()}`;
        // Мягко удалённая строка остаётся в таблице ради FK из заявок. Ни
        // воскрешать её, ни заводить рядом вторую миграция не должна: что
        // именно тут произошло, решать человеку.
        const user = await User.create({
            login: `backfill-deleted-${suffix}@test.local`,
            password: 'x',
            name: `Deleted ${suffix}`,
            role: roles.CONTRACTOR,
        });
        const softDeleted = await Contractor.create({ userId: user.id });
        await softDeleted.destroy();

        await up({ context: qi });

        expect(await Contractor.count({ where: { userId: user.id } })).toBe(0);
        expect(await Contractor.count({ where: { userId: user.id }, paranoid: false })).toBe(1);

        await Contractor.destroy({ where: { userId: user.id }, force: true });
        await User.destroy({ where: { id: user.id }, force: true });
    });

    it('не заводит строку заявке, ожидающей подтверждения менеджером', async () => {
        const { up, qi } = await loadMigration();

        const suffix = `${process.pid}-${Date.now()}`;
        // Такого пользователя обработает approveUser — он создаёт Contractor сам.
        // Если миграция заведёт строку заранее, после подтверждения их станет две.
        const pending = await User.create({
            login: `backfill-pending-${suffix}@test.local`,
            password: 'x',
            name: `Pending ${suffix}`,
            role: roles.CONTRACTOR,
            isActivated: false,
            pendingVerifyToken: `token-${suffix}`,
            pendingVerifyTokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });

        await up({ context: qi });

        expect(await Contractor.count({ where: { userId: pending.id } })).toBe(0);

        await Contractor.destroy({ where: { userId: pending.id }, force: true });
        await User.destroy({ where: { id: pending.id }, force: true });
    });

    it('не заводит строку отключённому пользователю', async () => {
        const { up, qi } = await loadMigration();

        const suffix = `${process.pid}-${Date.now()}`;
        const disabled = await User.create({
            login: `backfill-disabled-${suffix}@test.local`,
            password: 'x',
            name: `Disabled ${suffix}`,
            role: roles.CONTRACTOR,
            isDisabled: true,
        });

        await up({ context: qi });

        expect(await Contractor.count({ where: { userId: disabled.id } })).toBe(0);

        await Contractor.destroy({ where: { userId: disabled.id }, force: true });
        await User.destroy({ where: { id: disabled.id }, force: true });
    });
});
