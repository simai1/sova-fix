import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import User from '../../src/models/user';
import TgUser from '../../src/models/tgUser';
import Contractor from '../../src/models/contractor';
import UserObject from '../../src/models/userObject';
import TokenModel from '../../src/models/token-model';
import PushSubscription from '../../src/models/pushSubscription';
import UserTgBindingToken from '../../src/models/userTgBindingToken';
import RepairRequest from '../../src/models/repairRequest';
import RequestComment from '../../src/models/requestComment';
import roles from '../../src/config/roles';
import { createAdminAuth, TestAdminAuth } from '../helpers/auth-helper';
import { createObjectFor, createRequest, createUserAuth } from '../helpers/lk-helper';

const ADMIN_LOGIN = 'admin-delete@t.local';

describe('DELETE /users/:userId', () => {
    let admin: TestAdminAuth;

    const del = (userId: string) =>
        request(app).delete(`/users/${userId}`).set('Authorization', admin.authHeader).set('Cookie', admin.cookie);

    beforeAll(async () => {
        admin = await createAdminAuth(ADMIN_LOGIN);
    });

    afterAll(async () => {
        await User.destroy({ where: { login: ADMIN_LOGIN }, force: true });
    });

    it('удаляет TgUser-исполнителя без связанной записи Contractor', async () => {
        const tgUser = await TgUser.create({
            name: 'Orphan Tg Contractor',
            role: 4,
            tgId: 'delete-orphan-contractor',
            isConfirmed: true,
        });

        const contractor = await Contractor.findOne({ where: { tgUserId: tgUser.id } });
        expect(contractor).toBeNull();

        const res = await del(tgUser.id);

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ status: 'OK' });
        expect(await TgUser.findByPk(tgUser.id, { paranoid: false })).toBeNull();
    });

    it('409 при удалении пользователя с созданной заявкой — данные остаются на месте', async () => {
        const login = 'delete-with-request@t.local';
        const auth = await createUserAuth(login, roles.CUSTOMER, 'Author');
        const object = await createObjectFor(auth.user, 'Del Obj');
        const repairRequest = await createRequest({ objectId: object.id, createdByUserId: auth.user.id } as any);

        const res = await del(auth.user.id);

        expect(res.status).toBe(409);
        expect(res.body.message).toContain('отключите доступ');
        expect(await User.findByPk(auth.user.id)).not.toBeNull();
        expect(await RepairRequest.findByPk(repairRequest.id)).not.toBeNull();

        await RepairRequest.destroy({ where: { id: repairRequest.id }, force: true });
        await UserObject.destroy({ where: { userId: auth.user.id }, force: true });
        await TokenModel.destroy({ where: { userId: auth.user.id }, force: true });
        await User.destroy({ where: { id: auth.user.id }, force: true });
    });

    it('409 при удалении пользователя, у которого есть комментарий в чате заявки', async () => {
        const login = 'delete-with-comment@t.local';
        const auth = await createUserAuth(login, roles.CUSTOMER, 'Commenter');
        const object = await createObjectFor(auth.user, 'Del Obj C');
        const repairRequest = await createRequest({ objectId: object.id } as any);
        const comment = await RequestComment.create({
            requestId: repairRequest.id,
            authorUserId: auth.user.id,
            authorRole: roles.CUSTOMER,
            text: 'комментарий',
        } as any);

        const res = await del(auth.user.id);

        expect(res.status).toBe(409);
        expect(await User.findByPk(auth.user.id)).not.toBeNull();

        await RequestComment.destroy({ where: { id: comment.id }, force: true });
        await RepairRequest.destroy({ where: { id: repairRequest.id }, force: true });
        await UserObject.destroy({ where: { userId: auth.user.id }, force: true });
        await TokenModel.destroy({ where: { userId: auth.user.id }, force: true });
        await User.destroy({ where: { id: auth.user.id }, force: true });
    });

    it('409 считает и мягко удалённые заявки — они физически держат FK', async () => {
        const login = 'delete-soft-request@t.local';
        const auth = await createUserAuth(login, roles.CUSTOMER, 'Soft Author');
        const object = await createObjectFor(auth.user, 'Del Obj S');
        const repairRequest = await createRequest({ objectId: object.id, createdByUserId: auth.user.id } as any);
        await repairRequest.destroy();

        const res = await del(auth.user.id);
        expect(res.status).toBe(409);

        await RepairRequest.destroy({ where: { id: repairRequest.id }, force: true });
        await UserObject.destroy({ where: { userId: auth.user.id }, force: true });
        await TokenModel.destroy({ where: { userId: auth.user.id }, force: true });
        await User.destroy({ where: { id: auth.user.id }, force: true });
    });

    it('удаляет «чистого» пользователя вместе со служебными связями', async () => {
        const login = 'delete-clean@t.local';
        const auth = await createUserAuth(login, roles.CUSTOMER, 'Clean User');
        await createObjectFor(auth.user, 'Del Obj Clean');
        await PushSubscription.create({
            userId: auth.user.id,
            endpoint: `https://fcm.googleapis.com/fcm/send/${auth.user.id}`,
            p256dhKey: 'k',
            authKey: 'a',
        } as any);
        await UserTgBindingToken.create({
            userId: auth.user.id,
            tokenHash: `hash-${auth.user.id}`,
            expiresAt: new Date(Date.now() + 60_000),
        } as any);

        const res = await del(auth.user.id);

        expect(res.status).toBe(200);
        expect(await User.findByPk(auth.user.id, { paranoid: false })).toBeNull();
        expect(await UserObject.count({ where: { userId: auth.user.id }, paranoid: false })).toBe(0);
        expect(await PushSubscription.count({ where: { userId: auth.user.id }, paranoid: false })).toBe(0);
        expect(await UserTgBindingToken.count({ where: { userId: auth.user.id }, paranoid: false })).toBe(0);
        expect(await TokenModel.count({ where: { userId: auth.user.id }, paranoid: false })).toBe(0);
    });

    it('удаляет «чистого» исполнителя, и GET /contractors после этого отдаёт 200', async () => {
        const login = 'delete-clean-contractor@t.local';
        const auth = await createUserAuth(login, roles.CONTRACTOR, 'Clean Contractor');
        const contractor = await Contractor.create({ userId: auth.user.id });

        const res = await del(auth.user.id);
        expect(res.status).toBe(200);

        const stored = await Contractor.findByPk(contractor.id, { paranoid: false });
        expect(stored).not.toBeNull();
        expect(stored?.userId ?? null).toBeNull();
        expect(stored?.get('deletedAt')).not.toBeNull();

        const list = await request(app)
            .get('/contractors')
            .set('Authorization', admin.authHeader)
            .set('Cookie', admin.cookie);
        expect(list.status).toBe(200);
        expect(list.body.some((c: { id: string }) => c.id === contractor.id)).toBe(false);

        await Contractor.destroy({ where: { id: contractor.id }, force: true });
    });

    it('освобождает логин: тот же email можно завести заново', async () => {
        const login = 'delete-reuse-login@t.local';
        const auth = await createUserAuth(login, roles.CUSTOMER, 'Reusable');

        expect((await del(auth.user.id)).status).toBe(200);

        const recreated = await User.create({
            login,
            password: 'x',
            name: 'Reused',
            role: roles.CUSTOMER,
            isActivated: true,
        });
        expect(recreated.id).not.toBe(auth.user.id);
        await User.destroy({ where: { id: recreated.id }, force: true });
    });

    it('409 при удалении TG-пользователя с заявками', async () => {
        const tgUser = await TgUser.create({
            name: 'Tg With Requests',
            role: 3,
            tgId: `delete-tg-with-requests-${Date.now()}`,
            isConfirmed: true,
        });
        const repairRequest = await createRequest({ createdBy: tgUser.id } as any);

        const res = await del(tgUser.id);
        expect(res.status).toBe(409);
        expect(await TgUser.findByPk(tgUser.id)).not.toBeNull();

        await RepairRequest.destroy({ where: { id: repairRequest.id }, force: true });
        await TgUser.destroy({ where: { id: tgUser.id }, force: true });
    });

    it('400 при невалидном идентификаторе', async () => {
        const res = await del('not-a-uuid');
        expect(res.status).toBe(400);
    });
});
