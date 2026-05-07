import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import lkService from '../../src/services/lk.service';
import RepairRequest from '../../src/models/repairRequest';
import Contractor from '../../src/models/contractor';
import User from '../../src/models/user';
import UserObject from '../../src/models/userObject';
import ObjectDir from '../../src/models/object';
import LegalEntity from '../../src/models/legalEntity';
import Unit from '../../src/models/unit';
import Urgency from '../../src/models/urgency';
import statuses from '../../src/config/statuses';

// Этот файл проверяет ключевые инварианты lk.service в обход supertest/app.ts —
// чтобы не падать на pre-existing проблеме с jsonwebtoken/buffer-equal-constant-time
// при загрузке Express-app в vitest.

describe('lkService — инварианты', () => {
    const meLogin = 'lk-svc-me@t.local';
    const otherLogin = 'lk-svc-other@t.local';
    let meId: string;
    let myContractorId: string;
    let otherContractorId: string;
    let objectIdMine: string;
    let objectIdForeign: string;
    let urgencyId: string;
    let myReq: RepairRequest;
    let otherReq: RepairRequest;
    let byObjectReq: RepairRequest;

    const cleanup = async () => {
        for (const login of [meLogin, otherLogin]) {
            const u = await User.findOne({ where: { login } });
            if (u) {
                await UserObject.destroy({ where: { userId: u.id }, force: true });
                await Contractor.destroy({ where: { userId: u.id }, force: true });
                await RepairRequest.destroy({ where: { createdByUserId: u.id }, force: true });
                await User.destroy({ where: { id: u.id }, force: true });
            }
        }
    };

    beforeAll(async () => {
        await cleanup();

        // beforeCreate-хуки считают `number`, но валидация работает раньше → передаём `number: 0`.
        let legal = await LegalEntity.findOne({ where: { name: 'LK SVC LE' } });
        if (!legal)
            legal = await LegalEntity.create({
                name: 'LK SVC LE',
                legalForm: 'ООО',
                startCoop: new Date(),
                count: 0,
                number: 0,
            } as any);
        let unit = await Unit.findOne({ where: { name: 'LK SVC Unit' } });
        if (!unit) unit = await Unit.create({ name: 'LK SVC Unit', count: 0, number: 0 } as any);
        let urgency = await Urgency.findOne({ where: { name: 'LK SVC Urg' } });
        if (!urgency) urgency = await Urgency.create({ name: 'LK SVC Urg', color: '#fff', number: 0 } as any);
        urgencyId = urgency.id;

        const me = await User.create({
            login: meLogin,
            password: 'x',
            name: 'Me',
            role: 4,
            isActivated: true,
        } as any);
        const other = await User.create({
            login: otherLogin,
            password: 'x',
            name: 'Other',
            role: 4,
            isActivated: true,
        } as any);
        meId = me.id;
        void other;

        const myContr = await Contractor.create({ name: `MyC-${me.id.slice(0, 6)}`, userId: me.id });
        const otherContr = await Contractor.create({ name: `OtherC-${other.id.slice(0, 6)}`, userId: other.id });
        myContractorId = myContr.id;
        otherContractorId = otherContr.id;

        const objMine = await ObjectDir.create({
            name: `LK SVC Obj Mine ${me.id.slice(0, 6)}`,
            unitId: unit.id,
            legalEntityId: legal.id,
            city: 'Москва',
            number: 0,
        } as any);
        const objForeign = await ObjectDir.create({
            name: `LK SVC Obj Foreign ${other.id.slice(0, 6)}`,
            unitId: unit.id,
            legalEntityId: legal.id,
            city: 'Москва',
            number: 0,
        } as any);
        objectIdMine = objMine.id;
        objectIdForeign = objForeign.id;
        await UserObject.create({ userId: me.id, objectId: objMine.id });

        myReq = await RepairRequest.create({
            unitId: unit.id,
            legalEntityId: legal.id,
            urgency: urgency.name,
            urgencyId: urgency.id,
            status: statuses.AT_WORK,
            builder: 'Внутренний сотрудник',
            daysAtWork: 0,
            number: 0,
            contractorId: myContr.id,
        } as any);
        otherReq = await RepairRequest.create({
            unitId: unit.id,
            legalEntityId: legal.id,
            urgency: urgency.name,
            urgencyId: urgency.id,
            status: statuses.AT_WORK,
            builder: 'Внутренний сотрудник',
            daysAtWork: 0,
            number: 0,
            contractorId: otherContr.id,
        } as any);
        byObjectReq = await RepairRequest.create({
            unitId: unit.id,
            legalEntityId: legal.id,
            urgency: urgency.name,
            urgencyId: urgency.id,
            status: statuses.NEW_REQUEST,
            builder: 'Укажите подрядчика',
            daysAtWork: 0,
            number: 0,
            objectId: objMine.id,
        } as any);
    });

    afterAll(async () => {
        await RepairRequest.destroy({
            where: { id: [myReq.id, otherReq.id, byObjectReq.id] },
            force: true,
        });
        await Contractor.destroy({ where: { id: [myContractorId, otherContractorId] }, force: true });
        await ObjectDir.destroy({ where: { id: [objectIdMine, objectIdForeign] }, force: true });
        await cleanup();
    });

    it('listForContractor возвращает свои + по объектам, не возвращает чужие', async () => {
        const data = await lkService.listForContractor(meId, { limit: 100 });
        const ids = data.items.map(i => i.id);
        expect(ids).toContain(myReq.id);
        expect(ids).toContain(byObjectReq.id);
        expect(ids).not.toContain(otherReq.id);
        expect(data.page).toBe(1);
        expect(data.limit).toBe(100);
    });

    it('getOneForRole CONTRACTOR на чужую → 403', async () => {
        await expect(lkService.getOneForRole(meId, otherReq.id, 'CONTRACTOR')).rejects.toMatchObject({
            statusCode: 403,
            message: expect.stringMatching(/нет доступа/i),
        });
    });

    it('setStatusForContractor DONE без checkPhoto → 400 на русском', async () => {
        await myReq.update({ checkPhoto: null, status: statuses.AT_WORK });
        await expect(
            lkService.setStatusForContractor(meId, myReq.id, statuses.DONE, 'CONTRACTOR')
        ).rejects.toMatchObject({
            statusCode: 400,
            message: expect.stringMatching(/фото-подтверждения/i),
        });
    });

    it('setStatusForContractor DONE с checkPhoto → ok, статус=3, completeDate', async () => {
        await myReq.update({ checkPhoto: 'fake.jpg', status: statuses.AT_WORK });
        const dto = await lkService.setStatusForContractor(meId, myReq.id, statuses.DONE, 'CONTRACTOR');
        expect(dto.status).toBe(statuses.DONE);
        const fresh = await RepairRequest.findByPk(myReq.id);
        expect(fresh?.status).toBe(statuses.DONE);
        expect(fresh?.completeDate).toBeTruthy();
    });

    it('setStatusForContractor чужой заявки → 403', async () => {
        await expect(
            lkService.setStatusForContractor(meId, otherReq.id, statuses.AT_WORK, 'CONTRACTOR')
        ).rejects.toMatchObject({
            statusCode: 403,
        });
    });

    it('listForCustomer показывает только свои/по своим объектам', async () => {
        // Заявка, созданная me как customer.
        const created = await RepairRequest.create({
            unitId: byObjectReq.unitId,
            legalEntityId: byObjectReq.legalEntityId,
            objectId: objectIdMine,
            urgency: 'LK SVC Urg',
            urgencyId,
            status: statuses.NEW_REQUEST,
            builder: 'Укажите подрядчика',
            daysAtWork: 0,
            number: 0,
            createdByUserId: meId,
        } as any);
        try {
            const data = await lkService.listForCustomer(meId, { limit: 100 });
            const ids = data.items.map(i => i.id);
            expect(ids).toContain(created.id);
            expect(ids).not.toContain(otherReq.id);
        } finally {
            await RepairRequest.destroy({ where: { id: created.id }, force: true });
        }
    });

    it('createForCustomer на не свой объект → 400', async () => {
        await expect(
            lkService.createForCustomer(meId, {
                objectId: objectIdForeign,
                problemDescription: 'X',
                urgencyId,
            })
        ).rejects.toMatchObject({
            statusCode: 400,
            message: expect.stringMatching(/не входит в список ваших доступных/i),
        });
    });

    it('createForCustomer на свой объект → 201, createdByUserId=me', async () => {
        const dto = await lkService.createForCustomer(meId, {
            objectId: objectIdMine,
            problemDescription: 'Сломалось',
            urgencyId,
        });
        try {
            expect(dto.id).toBeTruthy();
            expect(dto.createdByUserId).toBe(meId);
            expect(dto.objectId).toBe(objectIdMine);
        } finally {
            await RepairRequest.destroy({ where: { id: dto.id }, force: true });
        }
    });

    it('addPhotos: лимит 10 — 11-й бросает 400 с русским сообщением', async () => {
        // Используем myReq (где meId назначен исполнителем): write-access проходит,
        // и срабатывает именно лимит, а не write-гард.
        const initial = JSON.stringify(Array.from({ length: 10 }, (_, i) => `f${i}.jpg`));
        await myReq.update({ fileName: initial });
        await expect(
            lkService.addPhotos(meId, myReq.id, 'CONTRACTOR', [{ filename: 'f10.jpg' } as any])
        ).rejects.toMatchObject({
            statusCode: 400,
            message: expect.stringMatching(/Превышен лимит/i),
        });
    });

    it('addPhotos: write-гард — без назначения CONTRACTOR не может писать → 403', async () => {
        await expect(
            lkService.addPhotos(meId, byObjectReq.id, 'CONTRACTOR', [{ filename: 'x.jpg' } as any])
        ).rejects.toMatchObject({
            statusCode: 403,
            message: expect.stringMatching(/назначенный исполнитель/i),
        });
    });
});
