import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import RepairRequest from '../../src/models/repairRequest';
import Contractor from '../../src/models/contractor';
import RequestComment from '../../src/models/requestComment';
import {
    createUserAuth,
    ensureBaseRefs,
    createObjectFor,
    createContractorFor,
    createRequest,
    cleanupByLogin,
    TestAuth,
} from '../helpers/lk-helper';
import roles from '../../src/config/roles';

describe('LK chat-комментарии', () => {
    const meLogin = 'lk-chat-me@t.local';
    const otherLogin = 'lk-chat-other@t.local';
    const custLogin = 'lk-chat-cust@t.local';
    let me: TestAuth;
    let other: TestAuth;
    let cust: TestAuth;
    let myContractor: Contractor;
    let otherContractor: Contractor;
    let myRequest: RepairRequest;
    let otherRequest: RepairRequest;
    let custRequest: RepairRequest;

    beforeAll(async () => {
        await ensureBaseRefs();
        await cleanupByLogin(meLogin);
        await cleanupByLogin(otherLogin);
        await cleanupByLogin(custLogin);

        me = await createUserAuth(meLogin, roles.CONTRACTOR, 'Chat Me');
        other = await createUserAuth(otherLogin, roles.CONTRACTOR, 'Chat Other');
        cust = await createUserAuth(custLogin, roles.CUSTOMER, 'Chat Cust');

        myContractor = await createContractorFor(me.user, 'ChatMy');
        otherContractor = await createContractorFor(other.user, 'ChatOther');

        const obj = await createObjectFor(cust.user, 'ChatObj');

        myRequest = await createRequest({ contractorId: myContractor.id, objectId: obj.id });
        otherRequest = await createRequest({ contractorId: otherContractor.id });
        custRequest = await createRequest({ objectId: obj.id, createdByUserId: cust.user.id });
    });

    afterAll(async () => {
        await RequestComment.destroy({
            where: { requestId: [myRequest.id, otherRequest.id, custRequest.id] },
            force: true,
        });
        await RepairRequest.destroy({
            where: { id: [myRequest.id, otherRequest.id, custRequest.id] },
            force: true,
        });
        await Contractor.destroy({
            where: { id: [myContractor.id, otherContractor.id] },
            force: true,
        });
        await cleanupByLogin(meLogin);
        await cleanupByLogin(otherLogin);
        await cleanupByLogin(custLogin);
    });

    it('POST /comments создаёт RequestComment, write-through legacy `comment`, ws COMMENT_CREATE', async () => {
        const res = await request(app)
            .post(`/lk/requests/${myRequest.id}/comments`)
            .set('Authorization', me.authHeader)
            .set('Cookie', me.cookie)
            .field('text', 'Первое сообщение');
        expect(res.status).toBe(201);
        expect(res.body.text).toBe('Первое сообщение');
        expect(res.body.author.id).toBe(me.user.id);
        expect(res.body.author.role).toBe(roles.CONTRACTOR);
        expect(res.body.author.roleName).toBe('CONTRACTOR');

        // write-through legacy
        const fresh = await RepairRequest.findByPk(myRequest.id);
        expect(fresh?.comment).toBe('Первое сообщение');

        const stored = await RequestComment.findOne({ where: { requestId: myRequest.id } });
        expect(stored?.authorUserId).toBe(me.user.id);
    });

    it('POST /comments несколько сообщений → последнее в legacy `comment`, история в RequestComment', async () => {
        await request(app)
            .post(`/lk/requests/${myRequest.id}/comments`)
            .set('Authorization', me.authHeader)
            .set('Cookie', me.cookie)
            .field('text', 'Второе');
        await request(app)
            .post(`/lk/requests/${myRequest.id}/comments`)
            .set('Authorization', me.authHeader)
            .set('Cookie', me.cookie)
            .field('text', 'Третье');

        const fresh = await RepairRequest.findByPk(myRequest.id);
        expect(fresh?.comment).toBe('Третье');

        const all = await RequestComment.findAll({
            where: { requestId: myRequest.id },
            order: [['createdAt', 'ASC']],
        });
        expect(all.length).toBeGreaterThanOrEqual(3);
        expect(all[all.length - 1].text).toBe('Третье');
    });

    it('POST /comments на чужую заявку (CONTRACTOR) → 403 «назначенный исполнитель»', async () => {
        const res = await request(app)
            .post(`/lk/requests/${otherRequest.id}/comments`)
            .set('Authorization', me.authHeader)
            .set('Cookie', me.cookie)
            .field('text', 'Несанкционированно');
        expect(res.status).toBe(403);
        expect(res.body.message).toMatch(/назначенный исполнитель/i);
    });

    it('POST /comments customer на чужую заявку → 403 «автор»', async () => {
        const res = await request(app)
            .post(`/lk/requests/${otherRequest.id}/comments`)
            .set('Authorization', cust.authHeader)
            .set('Cookie', cust.cookie)
            .field('text', 'Несанкционированно');
        expect(res.status).toBe(403);
        expect(res.body.message).toMatch(/автор|нет доступа/i);
    });

    it('POST /comments customer на свою заявку → 201', async () => {
        const res = await request(app)
            .post(`/lk/requests/${custRequest.id}/comments`)
            .set('Authorization', cust.authHeader)
            .set('Cookie', cust.cookie)
            .field('text', 'Cust msg');
        expect(res.status).toBe(201);
        expect(res.body.author.role).toBe(roles.CUSTOMER);
    });

    it('POST /comments пустой текст → 400 «не может быть пустым»', async () => {
        const res = await request(app)
            .post(`/lk/requests/${myRequest.id}/comments`)
            .set('Authorization', me.authHeader)
            .set('Cookie', me.cookie)
            .field('text', '');
        expect(res.status).toBe(400);
    });

    it('POST /comments слишком длинный текст → 400', async () => {
        const tooLong = 'a'.repeat(4001);
        const res = await request(app)
            .post(`/lk/requests/${myRequest.id}/comments`)
            .set('Authorization', me.authHeader)
            .set('Cookie', me.cookie)
            .field('text', tooLong);
        expect(res.status).toBe(400);
    });

    it('POST /comments без auth → 401', async () => {
        const res = await request(app).post(`/lk/requests/${myRequest.id}/comments`).field('text', 'Anon');
        expect(res.status).toBe(401);
    });

    it('GET /comments возвращает ASC по createdAt и author info', async () => {
        const res = await request(app)
            .get(`/lk/requests/${myRequest.id}/comments`)
            .set('Authorization', me.authHeader)
            .set('Cookie', me.cookie);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.items)).toBe(true);
        expect(res.body.items.length).toBeGreaterThan(0);
        const ts = res.body.items.map((c: any) => Date.parse(c.createdAt));
        const sorted = [...ts].sort((a, b) => a - b);
        expect(ts).toEqual(sorted);
        for (const c of res.body.items) {
            expect(c.author).toBeDefined();
            expect(c.author.id).toBeDefined();
            expect(c.author.roleName).toBeDefined();
        }
    });

    it('GET /comments cursor-пагинация: limit=1, hasMore=true, nextCursor валиден', async () => {
        const first = await request(app)
            .get(`/lk/requests/${myRequest.id}/comments?limit=1`)
            .set('Authorization', me.authHeader)
            .set('Cookie', me.cookie);
        expect(first.status).toBe(200);
        expect(first.body.items.length).toBe(1);
        expect(first.body.hasMore).toBe(true);
        expect(typeof first.body.nextCursor).toBe('string');

        const second = await request(app)
            .get(`/lk/requests/${myRequest.id}/comments?limit=1&cursor=${encodeURIComponent(first.body.nextCursor)}`)
            .set('Authorization', me.authHeader)
            .set('Cookie', me.cookie);
        expect(second.status).toBe(200);
        expect(second.body.items.length).toBe(1);
        // Не должно быть пересечения по id с первой страницей.
        expect(second.body.items[0].id).not.toBe(first.body.items[0].id);
    });

    it('GET /comments limit=51 → 400', async () => {
        const res = await request(app)
            .get(`/lk/requests/${myRequest.id}/comments?limit=51`)
            .set('Authorization', me.authHeader)
            .set('Cookie', me.cookie);
        expect(res.status).toBe(400);
    });

    it('GET /comments cursor=garbage → 400 «Некорректный курсор»', async () => {
        const res = await request(app)
            .get(`/lk/requests/${myRequest.id}/comments?cursor=garbage`)
            .set('Authorization', me.authHeader)
            .set('Cookie', me.cookie);
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/Некорректный курсор/i);
    });

    it('GET /comments чужой заявки → 403', async () => {
        const res = await request(app)
            .get(`/lk/requests/${otherRequest.id}/comments`)
            .set('Authorization', me.authHeader)
            .set('Cookie', me.cookie);
        expect(res.status).toBe(403);
    });
});
