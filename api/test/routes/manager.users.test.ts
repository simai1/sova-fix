import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import roles from '../../src/config/roles';
import ObjectDir from '../../src/models/object';
import TgUser from '../../src/models/tgUser';
import User from '../../src/models/user';
import UserObject from '../../src/models/userObject';
import { createAdminAuth, createManagerAuth, TestAdminAuth } from '../helpers/auth-helper';
import { cleanupByLogin, createObjectFor } from '../helpers/lk-helper';

const roleCases = [
    ['ADMIN', roles.ADMIN],
    ['CUSTOMER', roles.CUSTOMER],
    ['CONTRACTOR', roles.CONTRACTOR],
    ['OBSERVER', roles.OBSERVER],
    ['MANAGER', roles.MANAGER],
] as const;

describe('Manager: управление пользователями', () => {
    const forbiddenRegisterLogin = 'manager-forbidden-create@t.local';
    const customerLogin = 'manager-customer-target@t.local';
    const managerAssignmentLogin = 'manager-assignment-target@t.local';
    const regularRoleLogin = 'manager-regular-role-target@t.local';
    const roleChangeLogin = 'manager-role-change-target@t.local';
    const pendingLogin = 'manager-pending-target@t.local';
    const tgId = 'manager-confirm-target';
    let admin: TestAdminAuth;
    let manager: TestAdminAuth;
    let customer: User;
    let managerAssignmentTarget: User;
    let regularRoleTarget: User;
    let roleChangeTarget: User;
    let pendingTarget: User;
    let tgTarget: TgUser;
    let assignedObject: ObjectDir;

    beforeAll(async () => {
        for (const login of [
            forbiddenRegisterLogin,
            customerLogin,
            managerAssignmentLogin,
            regularRoleLogin,
            roleChangeLogin,
            pendingLogin,
            'manager-users-admin@t.local',
            'manager-users-manager@t.local',
        ]) {
            await cleanupByLogin(login);
        }
        await TgUser.destroy({ where: { tgId }, force: true });

        admin = await createAdminAuth('manager-users-admin@t.local');
        manager = await createManagerAuth('manager-users-manager@t.local');
        customer = await User.create({
            login: customerLogin,
            password: 'x',
            name: 'Customer target',
            role: roles.CUSTOMER,
            isActivated: true,
        });
        managerAssignmentTarget = await User.create({
            login: managerAssignmentLogin,
            password: 'x',
            name: 'Manager assignment target',
            role: roles.OBSERVER,
            isActivated: true,
        });
        regularRoleTarget = await User.create({
            login: regularRoleLogin,
            password: 'x',
            name: 'Regular role target',
            role: roles.OBSERVER,
            isActivated: true,
        });
        roleChangeTarget = await User.create({
            login: roleChangeLogin,
            password: 'x',
            name: 'Role change target',
            role: roles.CUSTOMER,
            isActivated: true,
        });
        pendingTarget = await User.create({
            login: pendingLogin,
            password: 'x',
            name: 'Pending target',
            role: roles.CUSTOMER,
            isActivated: false,
            pendingVerifyToken: 'a'.repeat(64),
            pendingVerifyTokenExpiresAt: new Date(Date.now() + 60_000),
        });
        tgTarget = await TgUser.create({
            name: 'TG target',
            role: roles.CUSTOMER,
            tgId,
            isConfirmed: false,
        });
        assignedObject = await createObjectFor(roleChangeTarget, 'Manager role preservation');
    });

    afterAll(async () => {
        await UserObject.destroy({ where: { objectId: assignedObject.id }, force: true });
        await assignedObject.destroy({ force: true });
        await TgUser.destroy({ where: { id: tgTarget.id }, force: true });
        for (const login of [
            forbiddenRegisterLogin,
            customerLogin,
            managerAssignmentLogin,
            regularRoleLogin,
            roleChangeLogin,
            pendingLogin,
            'manager-users-admin@t.local',
            'manager-users-manager@t.local',
        ]) {
            await cleanupByLogin(login);
        }
    });

    it('Менеджер не может регистрировать пользователей', async () => {
        const response = await request(app)
            .post('/auth/register')
            .set('Authorization', manager.authHeader)
            .set('Cookie', manager.cookie)
            .send({ login: forbiddenRegisterLogin, role: roles.CUSTOMER });

        expect(response.status).toBe(403);
        expect(await User.findOne({ where: { login: forbiddenRegisterLogin } })).toBeNull();
    });

    it('Менеджер не может удалять пользователей', async () => {
        const response = await request(app)
            .delete(`/users/${customer.id}`)
            .set('Authorization', manager.authHeader)
            .set('Cookie', manager.cookie);

        expect(response.status).toBe(403);
        expect(await User.findByPk(customer.id)).not.toBeNull();
    });

    it('Администратор заменяет роль на MANAGER и сохраняет UserObject', async () => {
        const response = await request(app)
            .post('/users/setRole')
            .set('Authorization', admin.authHeader)
            .set('Cookie', admin.cookie)
            .send({ userId: roleChangeTarget.id, role: roles.MANAGER });

        expect(response.status).toBe(200);
        expect((await User.findByPk(roleChangeTarget.id))?.role).toBe(roles.MANAGER);
        expect(await UserObject.count({ where: { userId: roleChangeTarget.id, objectId: assignedObject.id } })).toBe(1);
    });

    it.each(roleCases)('Менеджер получает 403 при назначении роли %s', async (_roleName, role) => {
        await managerAssignmentTarget.update({ role: roles.OBSERVER });

        const response = await request(app)
            .post('/users/setRole')
            .set('Authorization', manager.authHeader)
            .set('Cookie', manager.cookie)
            .query({ actorUserId: admin.user.id })
            .send({ userId: managerAssignmentTarget.id, role, actorUserId: admin.user.id });

        expect(response.status).toBe(403);
        expect((await User.findByPk(managerAssignmentTarget.id))?.role).toBe(roles.OBSERVER);
    });

    it.each(roleCases)('Администратор назначает существующему пользователю роль %s', async (_roleName, role) => {
        await regularRoleTarget.update({ role: roles.OBSERVER });

        const response = await request(app)
            .post('/users/setRole')
            .set('Authorization', admin.authHeader)
            .set('Cookie', admin.cookie)
            .send({ userId: regularRoleTarget.id, role });

        expect(response.status).toBe(200);
        expect((await User.findByPk(regularRoleTarget.id))?.role).toBe(role);
    });

    it('Менеджер видит и подтверждает ожидающую регистрацию', async () => {
        const pending = await request(app)
            .get('/users/pending-registrations')
            .set('Authorization', manager.authHeader)
            .set('Cookie', manager.cookie);
        const approve = await request(app)
            .patch(`/users/${pendingTarget.id}/approve`)
            .set('Authorization', manager.authHeader)
            .set('Cookie', manager.cookie);

        expect(pending.status).toBe(200);
        expect(pending.body.some((user: { id: string }) => user.id === pendingTarget.id)).toBe(true);
        expect(approve.status).toBe(200);
        expect((await User.findByPk(pendingTarget.id))?.isActivated).toBe(true);
    });

    it('Менеджер подтверждает Telegram-пользователя', async () => {
        const response = await request(app)
            .patch(`/users/confirm/${tgTarget.id}`)
            .set('Authorization', manager.authHeader)
            .set('Cookie', manager.cookie);

        expect(response.status).toBe(200);
        expect((await TgUser.findByPk(tgTarget.id))?.isConfirmed).toBe(true);
    });

    it('Менеджер не меняет собственную роль', async () => {
        const response = await request(app)
            .post('/users/setRole')
            .set('Authorization', manager.authHeader)
            .set('Cookie', manager.cookie)
            .send({ userId: manager.user.id, role: roles.OBSERVER, actorUserId: admin.user.id });

        expect(response.status).toBe(403);
        expect((await User.findByPk(manager.user.id))?.role).toBe(roles.MANAGER);
    });

    it('Администратор не меняет собственную роль', async () => {
        const response = await request(app)
            .post('/users/setRole')
            .set('Authorization', admin.authHeader)
            .set('Cookie', admin.cookie)
            .send({ userId: admin.user.id, role: roles.OBSERVER, actorUserId: manager.user.id });

        expect(response.status).toBe(400);
        expect((await User.findByPk(admin.user.id))?.role).toBe(roles.ADMIN);
    });
});
