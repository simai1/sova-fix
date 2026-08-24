import { describe, it, expect, afterEach } from 'vitest';

import Contractor from '../../src/models/contractor';
import User from '../../src/models/user';
import roles from '../../src/config/roles';

const isNameNullable = async (): Promise<string | null> => {
    const { sequelize } = await import('../../src/models');
    const [rows] = await sequelize.query(`
        SELECT is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'contractors' AND column_name = 'name';
    `);
    return (rows as Array<{ is_nullable: string }>)[0]?.is_nullable ?? null;
};

const dropNameColumn = async (): Promise<void> => {
    const { sequelize } = await import('../../src/models');
    await sequelize.query(`ALTER TABLE "contractors" DROP COLUMN IF EXISTS "name";`);
};

describe('migration 2026-08-24-drop-not-null-contractors-name', () => {
    afterEach(async () => {
        // Тестовая схема генерится из моделей, где колонки name нет —
        // возвращаем её в это состояние, чтобы не влиять на соседние тесты.
        await dropNameColumn();
    });

    it('снимает NOT NULL и чинит создание Contractor', async () => {
        const { sequelize } = await import('../../src/models');
        const { up } = await import('../../src/migrations/2026-08-24-drop-not-null-contractors-name');
        const qi = sequelize.getQueryInterface();

        // Воспроизводим схему демо/прод-базы: колонка осталась с NOT NULL.
        await dropNameColumn();
        await sequelize.query(`ALTER TABLE "contractors" ADD COLUMN "name" VARCHAR(255) NOT NULL;`);

        const suffix = `${process.pid}-${Date.now()}`;
        const owner = await User.create({
            login: `not-null-name-${suffix}@test.local`,
            password: 'x',
            name: `Owner ${suffix}`,
            role: roles.CONTRACTOR,
            isActivated: true,
        });

        await expect(Contractor.create({ userId: owner.id })).rejects.toThrow();

        await up({ context: qi });
        await up({ context: qi });

        expect(await isNameNullable()).toBe('YES');

        const contractor = await Contractor.create({ userId: owner.id });
        expect(contractor.userId).toBe(owner.id);

        await Contractor.destroy({ where: { id: contractor.id }, force: true });
        await User.destroy({ where: { id: owner.id }, force: true });
    });

    it('ничего не делает, если колонки нет', async () => {
        const { sequelize } = await import('../../src/models');
        const { up } = await import('../../src/migrations/2026-08-24-drop-not-null-contractors-name');

        await dropNameColumn();
        await expect(up({ context: sequelize.getQueryInterface() })).resolves.toBeUndefined();
        expect(await isNameNullable()).toBeNull();
    });
});
