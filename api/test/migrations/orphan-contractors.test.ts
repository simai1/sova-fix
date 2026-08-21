import { describe, it, expect } from 'vitest';

import Contractor from '../../src/models/contractor';
import User from '../../src/models/user';
import roles from '../../src/config/roles';

describe('migration 2026-08-22-soft-delete-orphan-contractors', () => {
    it('прячет записи без userId и tgUserId, не трогая живые', async () => {
        const { sequelize } = await import('../../src/models');
        const { up } = await import('../../src/migrations/2026-08-22-soft-delete-orphan-contractors');
        const qi = sequelize.getQueryInterface();

        const suffix = `${process.pid}-${Date.now()}`;
        const owner = await User.create({
            login: `orphan-migration-${suffix}@test.local`,
            password: 'x',
            name: `Owner ${suffix}`,
            role: roles.CONTRACTOR,
            isActivated: true,
        });
        const orphan = await Contractor.create({});
        const linked = await Contractor.create({ userId: owner.id });

        await up({ context: qi });
        await up({ context: qi });

        await orphan.reload({ paranoid: false });
        await linked.reload({ paranoid: false });
        expect(orphan.deletedAt).not.toBeNull();
        expect(linked.deletedAt ?? null).toBeNull();

        await Contractor.destroy({ where: { id: [orphan.id, linked.id] }, force: true });
        await User.destroy({ where: { id: owner.id }, force: true });
    });
});
