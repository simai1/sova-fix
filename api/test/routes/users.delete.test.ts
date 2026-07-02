import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import User from '../../src/models/user';
import TgUser from '../../src/models/tgUser';
import Contractor from '../../src/models/contractor';
import { createAdminAuth, TestAdminAuth } from '../helpers/auth-helper';

describe('DELETE /users/:userId', () => {
    let admin: TestAdminAuth;

    beforeAll(async () => {
        admin = await createAdminAuth('admin-delete@t.local');
    });

    afterAll(async () => {
        await User.destroy({ where: { login: 'admin-delete@t.local' }, force: true });
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

        const res = await request(app)
            .delete(`/users/${tgUser.id}`)
            .set('Authorization', admin.authHeader)
            .set('Cookie', admin.cookie);

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ status: 'OK' });
        expect(await TgUser.findByPk(tgUser.id, { paranoid: false })).toBeNull();
    });
});
