import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';

vi.mock('../../src/services/email.service', () => ({ default: vi.fn() }));

import app from '../../src/app';
import sendMail from '../../src/services/email.service';
import roles from '../../src/config/roles';
import User from '../../src/models/user';
import Contractor from '../../src/models/contractor';
import contractorService from '../../src/services/contractor.service';
import { createAdminAuth, TestAdminAuth } from '../helpers/auth-helper';
import { cleanupByLogin } from '../helpers/lk-helper';

// POST /auth/register — создание пользователя администратором из ЛК: пароль
// уходит письмом, ФИО пользователь вводит сам при активации.
// Для роли «Исполнитель» одновременно должна появляться строка Contractor —
// иначе исполнитель виден в справочнике пользователей, но не в справочнике
// исполнителей, и назначить на него заявку невозможно.
describe('POST /auth/register (создание пользователя админом)', () => {
    const suffix = Date.now();
    const adminLogin = `reg-admin-actor-${suffix}@t.local`;
    const logins = {
        contractor: `reg-admin-contractor-${suffix}@t.local`,
        customer: `reg-admin-customer-${suffix}@t.local`,
        taken: `reg-admin-taken-${suffix}@t.local`,
        named: `reg-admin-named-${suffix}@t.local`,
    };
    const allLogins = Object.values(logins);

    let admin: TestAdminAuth;

    const postRegister = (login: string, role: number) =>
        request(app)
            .post('/auth/register')
            .set('Authorization', admin.authHeader)
            .set('Cookie', admin.cookie)
            .send({ login, role });

    beforeAll(async () => {
        for (const login of allLogins) await cleanupByLogin(login);
        await cleanupByLogin(adminLogin);
        admin = await createAdminAuth(adminLogin);
    });

    beforeEach(() => {
        vi.mocked(sendMail).mockClear();
    });

    afterAll(async () => {
        for (const login of allLogins) await cleanupByLogin(login);
        await cleanupByLogin(adminLogin);
    });

    it('роли CONTRACTOR создаёт строку Contractor с userId', async () => {
        const res = await postRegister(logins.contractor, roles.CONTRACTOR);

        expect(res.status).toBe(200);
        const created = await User.findOne({ where: { login: logins.contractor } });
        expect(created).not.toBeNull();
        expect(created!.role).toBe(roles.CONTRACTOR);

        const contractor = await Contractor.findOne({ where: { userId: created!.id } });
        expect(contractor).not.toBeNull();
    });

    it('роли CUSTOMER строку Contractor не создаёт', async () => {
        const res = await postRegister(logins.customer, roles.CUSTOMER);

        expect(res.status).toBe(200);
        const created = await User.findOne({ where: { login: logins.customer } });
        expect(await Contractor.count({ where: { userId: created!.id } })).toBe(0);
    });

    it('на занятый email отвечает 400 и не создаёт ни User, ни Contractor', async () => {
        await User.create({ login: logins.taken, password: 'x', name: 'Existing', role: roles.CUSTOMER });

        const res = await postRegister(logins.taken, roles.CONTRACTOR);

        expect(res.status).toBe(400);
        expect(await User.count({ where: { login: logins.taken } })).toBe(1);
        expect(sendMail).not.toHaveBeenCalled();
    });

    it('до активации показывает исполнителя в справочнике под его email', async () => {
        // register создаёт User с name: '' — ФИО появится только в activate().
        // Пустая строка не должна доезжать до UI: вместо неё показываем login.
        const res = await postRegister(logins.named, roles.CONTRACTOR);
        expect(res.status).toBe(200);

        const list = await contractorService.getAllContractors();
        const created = await User.findOne({ where: { login: logins.named } });
        const contractor = await Contractor.findOne({ where: { userId: created!.id } });

        const dto = list.find(c => c.id === contractor!.id);
        expect(dto).toBeDefined();
        expect(dto!.name).toBe(logins.named);
    });
});
