import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import SystemLog from '../../src/models/systemLog';
import { createAdminAuth, TestAdminAuth } from '../helpers/auth-helper';

describe('GET /admin/logs', () => {
    let admin: TestAdminAuth;
    const seedMarker = `__TEST_SYSLOG_${Date.now()}__`;

    beforeAll(async () => {
        await SystemLog.destroy({ where: {}, truncate: true, force: true });
        admin = await createAdminAuth('admin-syslogs@t.local');

        const now = Date.now();
        // Намеренно три уровня с разными createdAt — проверяем фильтр по level
        // и сортировку desc (самый свежий первым).
        await SystemLog.bulkCreate([
            {
                level: 'info',
                message: `${seedMarker} info message`,
                service: 'test-service',
                meta: { tag: 'a' },
                createdAt: new Date(now - 10_000),
            },
            {
                level: 'warn',
                message: `${seedMarker} warn message`,
                service: 'test-service',
                meta: null,
                createdAt: new Date(now - 5_000),
            },
            {
                level: 'error',
                message: `${seedMarker} error message`,
                service: 'test-service',
                meta: { code: 500 },
                createdAt: new Date(now - 1_000),
            },
        ]);
    });

    afterAll(async () => {
        await SystemLog.destroy({ where: {}, truncate: true, force: true });
        await (
            await import('../../src/models/user')
        ).default.destroy({
            where: { login: 'admin-syslogs@t.local' },
            force: true,
        });
    });

    it('401 без авторизации', async () => {
        const res = await request(app).get('/admin/logs');
        expect(res.status).toBe(401);
    });

    it('возвращает все логи по умолчанию, отсортированные desc', async () => {
        const res = await request(app)
            .get('/admin/logs')
            .set('Authorization', admin.authHeader)
            .set('Cookie', admin.cookie);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.items)).toBe(true);
        const ours = res.body.items.filter((it: any) => it.message.includes(seedMarker));
        expect(ours.length).toBe(3);
        // desc по createdAt: error (-1s), warn (-5s), info (-10s)
        expect(ours[0].level).toBe('error');
        expect(ours[1].level).toBe('warn');
        expect(ours[2].level).toBe('info');
    });

    it('фильтрует по level=error', async () => {
        const res = await request(app)
            .get('/admin/logs')
            .query({ level: 'error' })
            .set('Authorization', admin.authHeader)
            .set('Cookie', admin.cookie);
        expect(res.status).toBe(200);
        const ours = res.body.items.filter((it: any) => it.message.includes(seedMarker));
        expect(ours.length).toBe(1);
        expect(ours[0].level).toBe('error');
        expect(ours[0].meta).toEqual({ code: 500 });
    });

    it('поиск по подстроке через q', async () => {
        const res = await request(app)
            .get('/admin/logs')
            .query({ q: `${seedMarker} warn` })
            .set('Authorization', admin.authHeader)
            .set('Cookie', admin.cookie);
        expect(res.status).toBe(200);
        const ours = res.body.items.filter((it: any) => it.message.includes(seedMarker));
        expect(ours.length).toBe(1);
        expect(ours[0].level).toBe('warn');
    });

    it('limit + cursor: вторая страница идёт строго раньше первой', async () => {
        const first = await request(app)
            .get('/admin/logs')
            .query({ limit: 2 })
            .set('Authorization', admin.authHeader)
            .set('Cookie', admin.cookie);
        expect(first.status).toBe(200);
        expect(first.body.items.length).toBeLessThanOrEqual(2);
        expect(first.body.hasMore).toBe(true);
        expect(first.body.nextCursor).toBeTruthy();

        const second = await request(app)
            .get('/admin/logs')
            .query({ limit: 2, cursor: first.body.nextCursor })
            .set('Authorization', admin.authHeader)
            .set('Cookie', admin.cookie);
        expect(second.status).toBe(200);
        // Все записи второй страницы старше cursor'а (lt).
        const cursorMs = new Date(first.body.nextCursor).getTime();
        for (const it of second.body.items) {
            expect(new Date(it.createdAt).getTime()).toBeLessThan(cursorMs);
        }
    });

    it('400 при невалидном level', async () => {
        const res = await request(app)
            .get('/admin/logs')
            .query({ level: 'fatal' })
            .set('Authorization', admin.authHeader)
            .set('Cookie', admin.cookie);
        expect(res.status).toBe(400);
    });
});
