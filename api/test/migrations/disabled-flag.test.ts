import { describe, it, expect } from 'vitest';

describe('migration 2026-08-20-add-user-disabled-flag', () => {
    it('добавляет колонки и повторный прогон ничего не ломает', async () => {
        const { sequelize } = await import('../../src/models');
        const { up } = await import('../../src/migrations/2026-08-20-add-user-disabled-flag');
        const qi = sequelize.getQueryInterface();

        await up({ context: qi });
        await up({ context: qi });

        for (const table of ['users', 'tgUsers']) {
            const desc = await qi.describeTable(table);
            expect(Object.keys(desc)).toEqual(expect.arrayContaining(['is_disabled', 'disabled_at', 'disabled_by']));
            expect(desc.is_disabled.allowNull).toBe(false);
        }

        const [rows] = await sequelize.query(`SELECT count(*)::int AS n FROM users WHERE is_disabled IS NULL`);
        expect((rows[0] as { n: number }).n).toBe(0);
    });
});
