import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import User from '../../src/models/user';
import UserObject from '../../src/models/userObject';
import { createAdminAuth, TestAdminAuth } from '../helpers/auth-helper';
import { createUserAuth, ensureBaseRefs, createObjectFor, cleanupByLogin } from '../helpers/lk-helper';
import roles from '../../src/config/roles';

describe('Admin: GET/PUT /users/:userId/objects', () => {
    let admin: TestAdminAuth;
    const targetLogin = 'lk-objects-target@t.local';
    const nonAdminLogin = 'lk-objects-nonadmin@t.local';
    let targetId: string;
    let obj1Id: string;
    let obj2Id: string;

    beforeAll(async () => {
        await ensureBaseRefs();
        await cleanupByLogin(targetLogin);
        await cleanupByLogin(nonAdminLogin);
        await User.destroy({ where: { login: 'admin-objects@t.local' }, force: true });

        admin = await createAdminAuth('admin-objects@t.local');

        const u = await User.create({
            login: targetLogin,
            password: 'x',
            name: 'Target',
            role: roles.CUSTOMER,
            isActivated: true,
        });
        targetId = u.id;

        const o1 = await createObjectFor(u, 'O1');
        const o2 = await createObjectFor(u, 'O2');
        obj1Id = o1.id;
        obj2Id = o2.id;
        // На старте уже есть две связи — почистим, тест зальёт свои.
        await UserObject.destroy({ where: { userId: targetId }, force: true });
    });

    afterAll(async () => {
        await cleanupByLogin(targetLogin);
        await cleanupByLogin(nonAdminLogin);
        await User.destroy({ where: { login: 'admin-objects@t.local' }, force: true });
    });

    it('401 без авторизации', async () => {
        const res = await request(app).get(`/users/${targetId}/objects`);
        expect(res.status).toBe(401);
    });

    it('403 для не-админа', async () => {
        const nonAdmin = await createUserAuth(nonAdminLogin, roles.CUSTOMER);
        const res = await request(app)
            .get(`/users/${targetId}/objects`)
            .set('Authorization', nonAdmin.authHeader)
            .set('Cookie', nonAdmin.cookie);
        expect(res.status).toBe(403);
    });

    it('PUT перезаписывает список объектов', async () => {
        const res = await request(app)
            .put(`/users/${targetId}/objects`)
            .set('Authorization', admin.authHeader)
            .set('Cookie', admin.cookie)
            .send({ objectIds: [obj1Id, obj2Id] });
        expect(res.status).toBe(200);
        expect(res.body.objectIds).toEqual(expect.arrayContaining([obj1Id, obj2Id]));
        expect(res.body.objectIds).toHaveLength(2);

        const get1 = await request(app)
            .get(`/users/${targetId}/objects`)
            .set('Authorization', admin.authHeader)
            .set('Cookie', admin.cookie);
        expect(get1.status).toBe(200);
        expect(get1.body.objectIds).toEqual(expect.arrayContaining([obj1Id, obj2Id]));

        // Перезапись пустым массивом — стирает связи.
        const res2 = await request(app)
            .put(`/users/${targetId}/objects`)
            .set('Authorization', admin.authHeader)
            .set('Cookie', admin.cookie)
            .send({ objectIds: [] });
        expect(res2.status).toBe(200);
        expect(res2.body.objectIds).toEqual([]);
    });

    it('400 при невалидном UUID в objectIds', async () => {
        const res = await request(app)
            .put(`/users/${targetId}/objects`)
            .set('Authorization', admin.authHeader)
            .set('Cookie', admin.cookie)
            .send({ objectIds: ['not-a-uuid'] });
        expect(res.status).toBe(400);
    });
});
