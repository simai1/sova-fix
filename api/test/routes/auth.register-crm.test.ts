import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';

vi.mock('../../src/services/email.service', () => ({ default: vi.fn() }));

import app from '../../src/app';
import sendMail from '../../src/services/email.service';
import roles from '../../src/config/roles';
import User from '../../src/models/user';
import TgUser from '../../src/models/tgUser';
import Contractor from '../../src/models/contractor';
import RepairRequest from '../../src/models/repairRequest';
import { cleanupByLogin, ensureBaseRefs, createRequest } from '../helpers/lk-helper';

// POST /auth/registerCustomerCrm — выдача доступа в CRM из бота.
// Роль web-аккаунта определяется на сервере по tg_users.role; для исполнителя
// дополнительно проставляется Contractor.userId, без которого ЛК показал бы
// пустой список заявок, не выдав ошибки.
describe('POST /auth/registerCustomerCrm (доступ в CRM из бота)', () => {
    const testMasterKey = 'register-crm-test-master-key';
    const originalMasterKey = process.env.MASTER_API_KEY;
    const suffix = Date.now();

    // tgId и login уникальны на сьют, чтобы не пересекаться с другими файлами.
    const tgIds = {
        customer: `reg-crm-customer-${suffix}`,
        contractorWithRow: `reg-crm-contr-row-${suffix}`,
        contractorNoRow: `reg-crm-contr-norow-${suffix}`,
        admin: `reg-crm-admin-${suffix}`,
        taken: `reg-crm-taken-${suffix}`,
        twice: `reg-crm-twice-${suffix}`,
        conflict: `reg-crm-conflict-${suffix}`,
        e2e: `reg-crm-e2e-${suffix}`,
        missing: `reg-crm-missing-${suffix}`,
    };
    const logins = {
        customer: `reg-crm-customer-${suffix}@t.local`,
        contractorWithRow: `reg-crm-contr-row-${suffix}@t.local`,
        contractorNoRow: `reg-crm-contr-norow-${suffix}@t.local`,
        admin: `reg-crm-admin-${suffix}@t.local`,
        taken: `reg-crm-taken-${suffix}@t.local`,
        twiceFirst: `reg-crm-twice-1-${suffix}@t.local`,
        twiceSecond: `reg-crm-twice-2-${suffix}@t.local`,
        conflict: `reg-crm-conflict-${suffix}@t.local`,
        conflictOwner: `reg-crm-conflict-owner-${suffix}@t.local`,
        e2e: `reg-crm-e2e-${suffix}@t.local`,
    };

    const allTgIds = Object.values(tgIds);
    const allLogins = Object.values(logins);

    const createdRequestIds: string[] = [];

    const postAccess = (login: string, userId: string) =>
        request(app).post('/auth/registerCustomerCrm').set('master-api-key', testMasterKey).send({ login, user_id: userId });

    const createTgUser = (tgId: string, role: number) =>
        TgUser.create({ name: `Reg CRM ${role}`, role, tgId, isConfirmed: true });

    beforeAll(async () => {
        process.env.MASTER_API_KEY = testMasterKey;
        await ensureBaseRefs();
        for (const login of allLogins) await cleanupByLogin(login);
        await TgUser.destroy({ where: { tgId: allTgIds }, force: true });
    });

    beforeEach(() => {
        vi.mocked(sendMail).mockClear();
    });

    afterAll(async () => {
        if (createdRequestIds.length)
            await RepairRequest.destroy({ where: { id: createdRequestIds }, force: true });
        const tgUsers = await TgUser.findAll({ where: { tgId: allTgIds } });
        if (tgUsers.length)
            await Contractor.destroy({ where: { tgUserId: tgUsers.map(t => t.id) }, force: true });
        for (const login of allLogins) await cleanupByLogin(login);
        await TgUser.destroy({ where: { tgId: allTgIds }, force: true });
        if (originalMasterKey === undefined) delete process.env.MASTER_API_KEY;
        else process.env.MASTER_API_KEY = originalMasterKey;
    });

    it('заказчику создаёт User с ролью CUSTOMER и без Contractor', async () => {
        const tgUser = await createTgUser(tgIds.customer, roles.CUSTOMER);

        const res = await postAccess(logins.customer, tgIds.customer);

        expect(res.status).toBe(200);
        const created = await User.findOne({ where: { login: logins.customer } });
        expect(created).not.toBeNull();
        expect(created!.role).toBe(roles.CUSTOMER);
        expect(created!.tgManagerId).toBe(tgUser.id);
        expect(await Contractor.count({ where: { userId: created!.id } })).toBe(0);
        // В письме должна стоять роль аккаунта, а не «администратор».
        expect(vi.mocked(sendMail).mock.calls[0][4]).toBe('Заказчик');
    });

    it('исполнителю проставляет userId в существующую строку Contractor', async () => {
        const tgUser = await createTgUser(tgIds.contractorWithRow, roles.CONTRACTOR);
        // Так контрактор создаётся при регистрации исполнителя в боте: tgUserId есть, userId пуст.
        const existingContractor = await Contractor.create({ tgUserId: tgUser.id });

        const res = await postAccess(logins.contractorWithRow, tgIds.contractorWithRow);

        expect(res.status).toBe(200);
        const created = await User.findOne({ where: { login: logins.contractorWithRow } });
        expect(created!.role).toBe(roles.CONTRACTOR);
        expect(created!.tgManagerId).toBe(tgUser.id);

        await existingContractor.reload();
        expect(existingContractor.userId).toBe(created!.id);
        // Дубликат не создан — loadUserContext делает findOne и выбрал бы произвольную строку.
        expect(await Contractor.count({ where: { tgUserId: tgUser.id } })).toBe(1);
    });

    it('исполнителю без строки Contractor создаёт её с обоими полями', async () => {
        const tgUser = await createTgUser(tgIds.contractorNoRow, roles.CONTRACTOR);

        const res = await postAccess(logins.contractorNoRow, tgIds.contractorNoRow);

        expect(res.status).toBe(200);
        const created = await User.findOne({ where: { login: logins.contractorNoRow } });
        const contractor = await Contractor.findOne({ where: { tgUserId: tgUser.id } });
        expect(contractor).not.toBeNull();
        expect(contractor!.userId).toBe(created!.id);
    });

    it('возвращает 400 и не создаёт побочных эффектов, если email занят', async () => {
        const tgUser = await createTgUser(tgIds.taken, roles.CONTRACTOR);
        await User.create({ login: logins.taken, password: 'x', name: 'Existing', role: roles.CUSTOMER });

        const res = await postAccess(logins.taken, tgIds.taken);

        expect(res.status).toBe(400);
        expect(await User.count({ where: { tgManagerId: tgUser.id } })).toBe(0);
        expect(await Contractor.count({ where: { tgUserId: tgUser.id } })).toBe(0);
        expect(sendMail).not.toHaveBeenCalled();
    });

    it('возвращает 404, если Telegram-пользователь не найден', async () => {
        const res = await postAccess(`reg-crm-404-${suffix}@t.local`, tgIds.missing);

        expect(res.status).toBe(404);
        expect(await User.findOne({ where: { login: `reg-crm-404-${suffix}@t.local` } })).toBeNull();
    });

    it('возвращает 403 для роли вне списка «заказчик/исполнитель»', async () => {
        await createTgUser(tgIds.admin, 2); // 2 — менеджер в tg_users

        const res = await postAccess(logins.admin, tgIds.admin);

        expect(res.status).toBe(403);
        expect(await User.findOne({ where: { login: logins.admin } })).toBeNull();
    });

    it('возвращает 400 при повторной выдаче доступа тому же Telegram-пользователю', async () => {
        await createTgUser(tgIds.twice, roles.CUSTOMER);

        const first = await postAccess(logins.twiceFirst, tgIds.twice);
        const second = await postAccess(logins.twiceSecond, tgIds.twice);

        expect(first.status).toBe(200);
        expect(second.status).toBe(400);
        expect(await User.findOne({ where: { login: logins.twiceSecond } })).toBeNull();
    });

    it('возвращает 409 и откатывает транзакцию, если Contractor занят другим аккаунтом', async () => {
        const tgUser = await createTgUser(tgIds.conflict, roles.CONTRACTOR);
        const owner = await User.create({
            login: logins.conflictOwner,
            password: 'x',
            name: 'Conflict owner',
            role: roles.CONTRACTOR,
        });
        await Contractor.create({ tgUserId: tgUser.id, userId: owner.id });

        const res = await postAccess(logins.conflict, tgIds.conflict);

        expect(res.status).toBe(409);
        // Ключевая проверка атомарности: User создаётся до linkContractor в той же транзакции.
        expect(await User.findOne({ where: { login: logins.conflict } })).toBeNull();
        expect(sendMail).not.toHaveBeenCalled();
    });

    it('сквозной сценарий: исполнитель из бота доходит до своих заявок в ЛК', async () => {
        const tgUser = await createTgUser(tgIds.e2e, roles.CONTRACTOR);
        const contractor = await Contractor.create({ tgUserId: tgUser.id });

        const access = await postAccess(logins.e2e, tgIds.e2e);
        expect(access.status).toBe(200);

        // Одноразовый пароль уходит письмом: sendMail(login, 'registration', password, webUrl, roleName).
        expect(sendMail).toHaveBeenCalledTimes(1);
        const [mailTo, mailType, oneTimePassword, , mailRoleName] = vi.mocked(sendMail).mock.calls[0];
        expect(mailTo).toBe(logins.e2e);
        expect(mailType).toBe('registration');
        expect(typeof oneTimePassword).toBe('string');
        // В письме должна стоять роль аккаунта, а не «администратор».
        expect(mailRoleName).toBe('Исполнитель');

        // Первый вход неактивированного пользователя отдаёт только userId.
        const login = await request(app)
            .post('/auth/login')
            .send({ login: logins.e2e, password: oneTimePassword });
        expect(login.status).toBe(200);
        expect(login.body.userId).toBeDefined();
        expect(login.body.accessToken).toBeUndefined();

        const activate = await request(app)
            .post(`/auth/activate/${login.body.userId}`)
            .send({ password: 'NewStrongPass123', name: 'E2E Исполнитель' });
        expect(activate.status).toBe(200);
        expect(activate.body.user.role).toBe('CONTRACTOR');

        const authHeader = `Bearer ${activate.body.accessToken}`;
        const cookie = [`refreshToken=${activate.body.refreshToken}`];

        // Без Contractor.userId здесь пришёл бы contractor: null и пустой список заявок.
        const me = await request(app).get('/lk/me').set('Authorization', authHeader).set('Cookie', cookie);
        expect(me.status).toBe(200);
        expect(me.body.contractor?.id).toBe(contractor.id);

        const myRequest = await createRequest({ contractorId: contractor.id });
        createdRequestIds.push(myRequest.id);

        const list = await request(app)
            .get('/lk/requests?role=contractor&limit=100')
            .set('Authorization', authHeader)
            .set('Cookie', cookie);
        expect(list.status).toBe(200);
        expect(list.body.items.map((i: { id: string }) => i.id)).toContain(myRequest.id);
    });
});
