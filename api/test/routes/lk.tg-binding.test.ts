import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import UserTgBindingToken from '../../src/models/userTgBindingToken';
import TgUser from '../../src/models/tgUser';
import Contractor from '../../src/models/contractor';
import { createUserAuth, ensureBaseRefs, createContractorFor, cleanupByLogin, TestAuth } from '../helpers/lk-helper';
import roles from '../../src/config/roles';

// Self-binding TG_ID через бот-deep-link с одноразовым токеном.
// См. design-doc §D. Init выдаёт plaintext-токен в составе deepLink,
// в БД лежит SHA-256-hash; consume вызывается ботом по master-api-key.
describe('LK self-binding TG_ID (deep-link токен)', () => {
    const meLogin = 'lk-tgbind-me@t.local';
    let me: TestAuth;
    let myContractor: Contractor;

    const MASTER_KEY = process.env.MASTER_API_KEY || 'test-master-key';

    // Уникальный tgId на тест-сьют, чтобы не конфликтовать с другими тестами.
    const baseTgId = `99${Date.now() % 1_000_000_000}`;

    beforeAll(async () => {
        await ensureBaseRefs();
        await cleanupByLogin(meLogin);

        me = await createUserAuth(meLogin, roles.CONTRACTOR, 'TgBind Me');
        myContractor = await createContractorFor(me.user, 'TgBindContr');
    });

    afterAll(async () => {
        // Чистим все TgUser, созданные тестом — у них общий префикс tgId.
        await TgUser.destroy({ where: { tgId: [`${baseTgId}1`, `${baseTgId}2`, `${baseTgId}3`] }, force: true });
        await UserTgBindingToken.destroy({ where: { userId: me.user.id }, force: true });
        await Contractor.destroy({ where: { id: myContractor.id }, force: true });
        await cleanupByLogin(meLogin);
    });

    // Из deepLink "https://t.me/<bot>?start=link_<plaintext>" выдираем plaintext.
    const extractPlaintext = (deepLink: string): string => {
        const m = /start=link_([0-9a-f]+)/i.exec(deepLink);
        if (!m) throw new Error(`deepLink не содержит токен: ${deepLink}`);
        return m[1];
    };

    it('POST /lk/me/tg-binding/init → deepLink с plaintext-токеном и expiresAt', async () => {
        const res = await request(app)
            .post('/lk/me/tg-binding/init')
            .set('Authorization', me.authHeader)
            .set('Cookie', me.cookie)
            .send({});
        expect(res.status).toBe(200);
        expect(typeof res.body.deepLink).toBe('string');
        expect(res.body.deepLink).toMatch(/start=link_[0-9a-f]+/);
        expect(typeof res.body.expiresAt).toBe('string');
        // expiresAt в будущем (примерно +15 минут).
        const exp = Date.parse(res.body.expiresAt);
        expect(exp).toBeGreaterThan(Date.now() + 10 * 60 * 1000);
        expect(exp).toBeLessThan(Date.now() + 20 * 60 * 1000);
    });

    it('повторный init инвалидирует предыдущий активный токен', async () => {
        const r1 = await request(app)
            .post('/lk/me/tg-binding/init')
            .set('Authorization', me.authHeader)
            .set('Cookie', me.cookie)
            .send({});
        expect(r1.status).toBe(200);

        const r2 = await request(app)
            .post('/lk/me/tg-binding/init')
            .set('Authorization', me.authHeader)
            .set('Cookie', me.cookie)
            .send({});
        expect(r2.status).toBe(200);

        // Все токены, кроме самого свежего (expiresAt > now, consumedAt = null),
        // должны быть consumed. Жёстко не привязываемся к конкретному count'у —
        // у нас может быть и больше записей из прошлых it'ов в этом describe.
        const all = await UserTgBindingToken.findAll({
            where: { userId: me.user.id },
            order: [['createdAt', 'DESC']],
        });
        expect(all.length).toBeGreaterThanOrEqual(2);
        // Самый свежий — активный.
        expect(all[0].consumedAt).toBeFalsy();
        // Все более ранние — consumed.
        for (const rec of all.slice(1)) {
            expect(rec.consumedAt).toBeTruthy();
        }
    });

    it('POST /tgUsers/bind c валидным токеном → consumed, Contractor.tgUserId установлен', async () => {
        const init = await request(app)
            .post('/lk/me/tg-binding/init')
            .set('Authorization', me.authHeader)
            .set('Cookie', me.cookie)
            .send({});
        expect(init.status).toBe(200);
        const plaintext = extractPlaintext(init.body.deepLink);

        const tgId = `${baseTgId}1`;
        const bind = await request(app)
            .post('/tgUsers/bind')
            .set('master-api-key', MASTER_KEY)
            .send({ token: plaintext, tgId, username: 'bind_user' });
        expect(bind.status).toBe(200);
        expect(bind.body.ok).toBe(true);
        expect(bind.body.userId).toBe(me.user.id);
        expect(typeof bind.body.tgUserId).toBe('string');

        // Contractor.tgUserId привязан к созданному TgUser.
        const fresh = await Contractor.findByPk(myContractor.id);
        expect(fresh?.tgUserId).toBe(bind.body.tgUserId);

        // TgUser существует с заданным tgId.
        const tg = await TgUser.findOne({ where: { tgId } });
        expect(tg).not.toBeNull();
    });

    it('POST /tgUsers/bind дважды одним токеном → второй раз 400 «недействителен или истёк»', async () => {
        const init = await request(app)
            .post('/lk/me/tg-binding/init')
            .set('Authorization', me.authHeader)
            .set('Cookie', me.cookie)
            .send({});
        const plaintext = extractPlaintext(init.body.deepLink);

        const tgId = `${baseTgId}2`;
        const r1 = await request(app)
            .post('/tgUsers/bind')
            .set('master-api-key', MASTER_KEY)
            .send({ token: plaintext, tgId });
        expect(r1.status).toBe(200);

        const r2 = await request(app)
            .post('/tgUsers/bind')
            .set('master-api-key', MASTER_KEY)
            .send({ token: plaintext, tgId });
        expect(r2.status).toBe(400);
        expect(r2.body.message).toMatch(/недействителен|истёк/i);
    });

    it('POST /tgUsers/bind с истёкшим токеном → 400', async () => {
        const init = await request(app)
            .post('/lk/me/tg-binding/init')
            .set('Authorization', me.authHeader)
            .set('Cookie', me.cookie)
            .send({});
        const plaintext = extractPlaintext(init.body.deepLink);

        // Принудительно «состариваем» токен в БД.
        const crypto = await import('crypto');
        const tokenHash = crypto.createHash('sha256').update(plaintext).digest('hex');
        await UserTgBindingToken.update({ expiresAt: new Date(Date.now() - 60 * 1000) }, { where: { tokenHash } });

        const tgId = `${baseTgId}3`;
        const res = await request(app)
            .post('/tgUsers/bind')
            .set('master-api-key', MASTER_KEY)
            .send({ token: plaintext, tgId });
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/недействителен|истёк/i);
    });

    it('POST /tgUsers/bind без master-api-key → 401 Invalid Master Api Key', async () => {
        // Семантически это «не аутентифицирован» (отсутствующая/неверная master-api-key
        // — это credentials-failure, а не bad-request). Раньше middleware отдавал 400
        // и сравнивал ключ через `!==` (timing-side-channel). После security-фикса
        // (audit M-5) — `crypto.timingSafeEqual` + 401.
        const res = await request(app).post('/tgUsers/bind').send({ token: 'whatever', tgId: '12345' });
        expect(res.status).toBe(401);
    });

    it('POST /tgUsers/bind с заведомо неизвестным токеном → 400', async () => {
        const res = await request(app)
            .post('/tgUsers/bind')
            .set('master-api-key', MASTER_KEY)
            .send({ token: 'deadbeef'.repeat(4), tgId: '12345' });
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/недействителен|истёк/i);
    });

    it('GET /lk/me/tg-binding/status после bind → linked: true с маскированным tgId', async () => {
        // Используем уже привязанный tgId из теста выше.
        const res = await request(app)
            .get('/lk/me/tg-binding/status')
            .set('Authorization', me.authHeader)
            .set('Cookie', me.cookie);
        expect(res.status).toBe(200);
        expect(res.body.linked).toBe(true);
        expect(res.body.tgId).toMatch(/^\*\*\*\d{4}$/);
    });

    it('DELETE /lk/me/tg-binding → отвязывает Contractor.tgUserId', async () => {
        const res = await request(app)
            .delete('/lk/me/tg-binding')
            .set('Authorization', me.authHeader)
            .set('Cookie', me.cookie);
        expect(res.status).toBe(204);

        const fresh = await Contractor.findByPk(myContractor.id);
        expect(fresh?.tgUserId).toBeFalsy();

        // Повторный DELETE → 400 «Telegram не был привязан».
        const res2 = await request(app)
            .delete('/lk/me/tg-binding')
            .set('Authorization', me.authHeader)
            .set('Cookie', me.cookie);
        expect(res2.status).toBe(400);
    });
});
