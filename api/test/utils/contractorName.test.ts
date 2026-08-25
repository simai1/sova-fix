import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import User from '../../src/models/user';
import TgUser from '../../src/models/tgUser';
import Contractor from '../../src/models/contractor';
import roles from '../../src/config/roles';
import { getContractorName } from '../../src/utils/contractorName';
import { contractorNameILike, contractorNameOrderExpr } from '../../src/utils/contractorNameFilter';
import { cleanupByLogin } from '../helpers/lk-helper';

// Имя исполнителя выводится из связанных User/TgUser в двух местах сразу:
// в JS (utils/contractorName) и в SQL (utils/contractorNameFilter — сортировка,
// поиск, фильтры). Порядок источников обязан совпадать, иначе список
// отсортирован по одному значению, а показывает другое.
describe('имя исполнителя: фолбэк на email', () => {
    const suffix = Date.now();
    const logins = {
        blank: `cname-blank-${suffix}@t.local`,
        withTg: `cname-with-tg-${suffix}@t.local`,
    };
    const tgId = `cname-tg-${suffix}`;

    let blankUser: User;
    let tgUser: TgUser;
    let blankContractor: Contractor;

    beforeAll(async () => {
        for (const login of Object.values(logins)) await cleanupByLogin(login);
        await TgUser.destroy({ where: { tgId }, force: true });

        // Так выглядит исполнитель, созданный админом из ЛК и не активированный:
        // login есть, ФИО ещё нет.
        blankUser = await User.create({ login: logins.blank, password: 'x', name: '', role: roles.CONTRACTOR });
        blankContractor = await Contractor.create({ userId: blankUser.id });

        tgUser = await TgUser.create({ name: 'ТГ Исполнитель', role: roles.CONTRACTOR, tgId, isConfirmed: true });
    });

    afterAll(async () => {
        await Contractor.destroy({ where: { id: blankContractor.id }, force: true });
        await Contractor.destroy({ where: { tgUserId: tgUser.id }, force: true });
        for (const login of Object.values(logins)) await cleanupByLogin(login);
        await TgUser.destroy({ where: { tgId }, force: true });
    });

    it('пустое User.name уступает имени из Telegram', async () => {
        const user = await User.create({ login: logins.withTg, password: 'x', name: '', role: roles.CONTRACTOR });
        const contractor = await Contractor.create({ userId: user.id, tgUserId: tgUser.id });
        contractor.User = user;
        contractor.TgUser = tgUser;

        expect(getContractorName(contractor)).toBe('ТГ Исполнитель');
    });

    it('когда имени нет нигде, отдаёт login пользователя', () => {
        blankContractor.User = blankUser;
        expect(getContractorName(blankContractor)).toBe(logins.blank);
    });

    it('без User и TgUser по-прежнему отдаёт null', () => {
        const orphan = Contractor.build({ userId: null, tgUserId: null });
        expect(getContractorName(orphan)).toBeNull();
    });

    it('SQL-выражение ищет исполнителя с пустым ФИО по его email', async () => {
        const found = await Contractor.findAll({
            where: contractorNameILike(`%${logins.blank}%`, 'contractor'),
            include: [{ model: User }, { model: TgUser }],
        });

        expect(found.map(c => c.id)).toContain(blankContractor.id);
    });

    it('SQL-выражение сортировки даёт то же значение, что и JS', async () => {
        const [row] = (await Contractor.findAll({
            attributes: [[contractorNameOrderExpr('contractor'), 'effectiveName']],
            where: { id: blankContractor.id },
            include: [
                { model: User, attributes: [] },
                { model: TgUser, attributes: [] },
            ],
            raw: true,
        })) as unknown as Array<{ effectiveName: string }>;

        blankContractor.User = blankUser;
        expect(row.effectiveName).toBe(getContractorName(blankContractor));
    });
});
