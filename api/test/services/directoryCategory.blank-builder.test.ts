import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import User from '../../src/models/user';
import Contractor from '../../src/models/contractor';
import DirectoryCategory from '../../src/models/directoryCategory';
import roles from '../../src/config/roles';
import directoryCategoryService from '../../src/services/directoryCategory.service';
import { cleanupByLogin } from '../helpers/lk-helper';

// DirectoryCategoryDto строит builder через `new ContractorDto`, а тот бросает
// исключение на исполнителе без выводимого имени — то есть роняет весь список
// категорий в 500. Исполнитель, созданный через POST /auth/register и ещё не
// активированный, ровно такой: name = '', привязки к Telegram нет.
describe('справочник категорий с неактивированным исполнителем', () => {
    const suffix = Date.now();
    const login = `dircat-blank-${suffix}@t.local`;
    const categoryName = `Категория без ФИО ${suffix}`;

    let contractorId: string;
    let categoryId: string;

    beforeAll(async () => {
        await cleanupByLogin(login);
        await DirectoryCategory.destroy({ where: { name: categoryName }, force: true });

        const user = await User.create({ login, password: 'x', name: '', role: roles.CONTRACTOR });
        const contractor = await Contractor.create({ userId: user.id });
        contractorId = contractor.id;

        const maxNumber = (await DirectoryCategory.max('number')) as number | null;
        const category = await DirectoryCategory.create({
            name: categoryName,
            color: '#123456',
            number: (maxNumber ?? 0) + 1,
            builderId: contractorId,
        });
        categoryId = category.id;
    });

    afterAll(async () => {
        await DirectoryCategory.destroy({ where: { id: categoryId }, force: true });
        await Contractor.destroy({ where: { id: contractorId }, force: true });
        await cleanupByLogin(login);
    });

    it('отдаёт список, показывая исполнителя под его email', async () => {
        const list = await directoryCategoryService.getAllDirectoryCategory();

        const category = list.find((c: { id: string }) => c.id === categoryId);
        expect(category).toBeDefined();
        expect(category!.builder?.name).toBe(login);
    });
});
