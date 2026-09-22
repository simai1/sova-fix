import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import User from '../../src/models/user';
import UserObject from '../../src/models/userObject';
import TgUser from '../../src/models/tgUser';
import TgUserObject from '../../src/models/tgUserObject';
import Contractor from '../../src/models/contractor';
import { createAdminAuth, TestAdminAuth } from '../helpers/auth-helper';
import { ensureBaseRefs, createObjectFor, cleanupByLogin } from '../helpers/lk-helper';
import roles from '../../src/config/roles';

// Доступы к объектам живут в двух таблицах: userObjects (ВЕБ) и tgUserObjects (бот).
// Веб-справочник — источник правды, PUT /users/:id/objects обязан зеркалить
// назначения в tgUserObjects, иначе бот показывает устаревший срез.
describe('Admin: PUT /users/:userId/objects синхронизирует tgUserObjects', () => {
    let admin: TestAdminAuth;
    const contractorLogin = 'tgsync-contractor@t.local';
    const managerLogin = 'tgsync-manager@t.local';
    const noTgLogin = 'tgsync-no-tg@t.local';
    const adminLogin = 'admin-tgsync@t.local';

    let contractorId: string;
    let contractorTgUserId: string;
    let managerTargetId: string;
    let managerTgUserId: string;
    let noTgId: string;
    let obj1Id: string;
    let obj2Id: string;
    let obj3Id: string;

    const activeBotObjectIds = async (tgUserId: string): Promise<string[]> => {
        const rows = await TgUserObject.findAll({ where: { tgUserId }, attributes: ['objectId'] });
        return rows.map(r => r.objectId).sort();
    };

    const cleanupTgUser = async (tgId: string) => {
        const tg = await TgUser.findOne({ where: { tgId }, paranoid: false });
        if (!tg) return;
        await TgUserObject.destroy({ where: { tgUserId: tg.id }, force: true });
        await Contractor.destroy({ where: { tgUserId: tg.id }, force: true });
        await TgUser.destroy({ where: { id: tg.id }, force: true });
    };

    beforeAll(async () => {
        await ensureBaseRefs();
        for (const login of [contractorLogin, managerLogin, noTgLogin]) await cleanupByLogin(login);
        await User.destroy({ where: { login: adminLogin }, force: true });
        await cleanupTgUser('900000001');
        await cleanupTgUser('900000002');

        admin = await createAdminAuth(adminLogin);

        const contractorUser = await User.create({
            login: contractorLogin,
            password: 'x',
            name: 'TgSync Contractor',
            role: roles.CONTRACTOR,
            isActivated: true,
        });
        contractorId = contractorUser.id;

        // У tgUsers собственный диапазон ролей (1..5), роли web-User сюда не мапятся 1:1.
        const contractorTg = await TgUser.create({
            name: 'tgsync_contractor',
            role: 4,
            tgId: '900000001',
            isConfirmed: true,
        } as any);
        contractorTgUserId = contractorTg.id;
        await Contractor.create({ userId: contractorUser.id, tgUserId: contractorTg.id } as any);

        const managerUser = await User.create({
            login: managerLogin,
            password: 'x',
            name: 'TgSync Manager',
            role: roles.MANAGER,
            isActivated: true,
        });
        managerTargetId = managerUser.id;

        const managerTg = await TgUser.create({
            name: 'tgsync_manager',
            role: 2,
            tgId: '900000002',
            isConfirmed: true,
        } as any);
        managerTgUserId = managerTg.id;
        await managerUser.update({ tgManagerId: managerTg.id });

        const noTgUser = await User.create({
            login: noTgLogin,
            password: 'x',
            name: 'TgSync No Telegram',
            role: roles.CONTRACTOR,
            isActivated: true,
        });
        noTgId = noTgUser.id;

        const o1 = await createObjectFor(contractorUser, 'TgSync-O1');
        const o2 = await createObjectFor(contractorUser, 'TgSync-O2');
        const o3 = await createObjectFor(contractorUser, 'TgSync-O3');
        obj1Id = o1.id;
        obj2Id = o2.id;
        obj3Id = o3.id;

        await UserObject.destroy({ where: { userId: contractorId }, force: true });
    });

    afterAll(async () => {
        for (const login of [contractorLogin, managerLogin, noTgLogin]) await cleanupByLogin(login);
        await User.destroy({ where: { login: adminLogin }, force: true });
        await cleanupTgUser('900000001');
        await cleanupTgUser('900000002');
    });

    it('назначенные исполнителю объекты попадают в tgUserObjects', async () => {
        const res = await request(app)
            .put(`/users/${contractorId}/objects`)
            .set('Authorization', admin.authHeader)
            .set('Cookie', admin.cookie)
            .send({ objectIds: [obj1Id, obj2Id] });

        expect(res.status).toBe(200);
        expect(await activeBotObjectIds(contractorTgUserId)).toEqual([obj1Id, obj2Id].sort());
    });

    it('снятый в вебе объект пропадает и у бота', async () => {
        await request(app)
            .put(`/users/${contractorId}/objects`)
            .set('Authorization', admin.authHeader)
            .set('Cookie', admin.cookie)
            .send({ objectIds: [obj1Id, obj2Id] });

        const res = await request(app)
            .put(`/users/${contractorId}/objects`)
            .set('Authorization', admin.authHeader)
            .set('Cookie', admin.cookie)
            .send({ objectIds: [obj1Id] });

        expect(res.status).toBe(200);
        expect(await activeBotObjectIds(contractorTgUserId)).toEqual([obj1Id]);
    });

    it('ранее снятый доступ можно выдать снова — soft-deleted связь не блокирует', async () => {
        await request(app)
            .put(`/users/${contractorId}/objects`)
            .set('Authorization', admin.authHeader)
            .set('Cookie', admin.cookie)
            .send({ objectIds: [obj3Id] });
        // Имитируем исторический soft-delete связи (paranoid + unique индекс по паре).
        await TgUserObject.destroy({ where: { tgUserId: contractorTgUserId, objectId: obj3Id } });

        const res = await request(app)
            .put(`/users/${contractorId}/objects`)
            .set('Authorization', admin.authHeader)
            .set('Cookie', admin.cookie)
            .send({ objectIds: [obj3Id] });

        expect(res.status).toBe(200);
        expect(await activeBotObjectIds(contractorTgUserId)).toEqual([obj3Id]);
    });

    it('пустой список стирает доступы и в боте', async () => {
        await request(app)
            .put(`/users/${contractorId}/objects`)
            .set('Authorization', admin.authHeader)
            .set('Cookie', admin.cookie)
            .send({ objectIds: [obj1Id, obj2Id] });

        const res = await request(app)
            .put(`/users/${contractorId}/objects`)
            .set('Authorization', admin.authHeader)
            .set('Cookie', admin.cookie)
            .send({ objectIds: [] });

        expect(res.status).toBe(200);
        expect(await activeBotObjectIds(contractorTgUserId)).toEqual([]);
    });

    it('для менеджера синхронизация идёт через users.tgManagerId', async () => {
        const res = await request(app)
            .put(`/users/${managerTargetId}/objects`)
            .set('Authorization', admin.authHeader)
            .set('Cookie', admin.cookie)
            .send({ objectIds: [obj2Id] });

        expect(res.status).toBe(200);
        expect(await activeBotObjectIds(managerTgUserId)).toEqual([obj2Id]);
    });

    it('пользователь без привязанного Telegram сохраняется без ошибок', async () => {
        const res = await request(app)
            .put(`/users/${noTgId}/objects`)
            .set('Authorization', admin.authHeader)
            .set('Cookie', admin.cookie)
            .send({ objectIds: [obj1Id] });

        expect(res.status).toBe(200);
        expect(res.body.objectIds).toEqual([obj1Id]);
    });
});
