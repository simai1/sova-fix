import { Op, Order, WhereOptions } from 'sequelize';
import httpStatus from 'http-status';
import { sequelize } from '../models';
import RepairRequest from '../models/repairRequest';
import Contractor from '../models/contractor';
import ObjectDir from '../models/object';
import Unit from '../models/unit';
import LegalEntity from '../models/legalEntity';
import Urgency from '../models/urgency';
import Status from '../models/status';
import DirectoryCategory from '../models/directoryCategory';
import User from '../models/user';
import UserObject from '../models/userObject';
import RequestComment from '../models/requestComment';
import UserDto from '../dtos/user.dto';
import ObjectDto from '../dtos/object.dto';
import LkRequestDto from '../dtos/lkRequest.dto';
import RequestCommentDto from '../dtos/requestComment.dto';
import ApiError from '../utils/ApiError';
import { sendMsg, WsMsgData } from '../utils/ws';
import wsEvents from '../config/wsEvents';
import { normalizeFileNames } from '../utils/normalizeData';
import roles from '../config/roles';
import statuses from '../config/statuses';
import notificationService from './notification.service';

type Role = 'CONTRACTOR' | 'CUSTOMER' | 'ADMIN';

type ListQuery = {
    page?: number | string;
    limit?: number | string;
    search?: string;
    objectId?: string;
    unitId?: string;
    legalEntityId?: string;
    statusId?: string;
    urgencyId?: string;
    dateFrom?: string;
    dateTo?: string;
    sort?: string;
    order?: string;
};

type CommentListQuery = {
    cursor?: string;
    limit?: number | string;
    order?: string;
};

const FILE_LIMIT = 10;
const COMMENT_PAGE_DEFAULT = 30;
const COMMENT_PAGE_MAX = 50;

const lkInclude = [
    { model: Contractor },
    { model: ObjectDir, as: 'Object' },
    { model: Unit },
    { model: LegalEntity },
    { model: Urgency },
    { model: Status },
    { model: DirectoryCategory },
];

// Собирает контекст для текущего user'а в LK: его контрактора (если есть)
// и список объектов, к которым он привязан через UserObject.
const loadUserContext = async (userId: string) => {
    const [contractor, userObjects] = await Promise.all([
        Contractor.findOne({ where: { userId } }),
        UserObject.findAll({ where: { userId }, attributes: ['objectId'] }),
    ]);
    const objectIds = userObjects.map(uo => uo.objectId);
    return { contractor, objectIds };
};

// Возвращает полные карточки объектов, к которым привязан пользователь через UserObject.
// Используется фронтом ЛК (CreateRequest) — старый GET /objects живёт в TG-flow и для
// веб-CUSTOMER возвращает пусто. Новый код не должен зависеть от TgUserObject.
const getMyObjectsFull = async (userId: string): Promise<ObjectDto[]> => {
    const userObjects = await UserObject.findAll({ where: { userId }, attributes: ['objectId'] });
    const objectIds = userObjects.map(uo => uo.objectId);
    if (objectIds.length === 0) return [];
    const objects = await ObjectDir.findAll({
        where: { id: { [Op.in]: objectIds } },
        include: [{ model: Unit }, { model: LegalEntity }],
    });
    return objects.map(o => new ObjectDto(o));
};

const getMe = async (userId: string) => {
    const user = await User.findByPk(userId);
    if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'Пользователь не найден');
    const { contractor, objectIds } = await loadUserContext(userId);
    return {
        user: new UserDto(user),
        contractor: contractor ? { id: contractor.id } : null,
        objectIds,
    };
};

const parsePagination = (query: ListQuery) => {
    const rawPage = Number(query.page);
    const rawLimit = Number(query.limit);
    const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;
    let limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.floor(rawLimit) : 20;
    if (limit > 100) limit = 100;
    return { page, limit, offset: (page - 1) * limit };
};

// Сортировка с поддержкой relation-полей (только Urgency.number).
// Для status используем НЕ relation, а собственный SMALLINT-поле RepairRequest.status:
// исторически большая часть заявок (включая всё, что обновляется через
// setStatusForContractor) пишет только status, а statusId-UUID остаётся null.
// LEFT JOIN на Status даст NULL.number для таких заявок — и sort=status «складывает»
// их в кучу NULL'ов, ломая UI-ожидание (correctness-audit B1, см. design-doc §B.2).
const ORDER_BY_RELATION: Record<string, [any, string]> = {
    urgency: [{ model: Urgency, as: 'Urgency' }, 'number'],
};

const parseOrder = (query: ListQuery): Order => {
    const order = String(query.order || '').toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    const raw = query.sort ? String(query.sort) : 'createdAt';

    // Алиас 'date' → createdAt для удобства фронта (ТЗ говорит «по дате»).
    const dateAlias = raw === 'date' ? 'createdAt' : raw;

    if (ORDER_BY_RELATION[dateAlias]) {
        const [rel, field] = ORDER_BY_RELATION[dateAlias];
        return [[rel, field, order]] as Order;
    }

    // status сортируем по RepairRequest.status (SMALLINT 1..5) — это единственное
    // поле, которое реально заполнено для всех заявок (см. комментарий выше).
    if (dateAlias === 'status') {
        return [['status', order]];
    }

    const allowedSort = new Set(['createdAt']);
    const sort = allowedSort.has(dateAlias) ? dateAlias : 'createdAt';
    return [[sort, order]];
};

const buildBaseFilter = (query: ListQuery, ownership: WhereOptions): WhereOptions => {
    const where: any = { ...ownership };
    if (query.objectId) where.objectId = query.objectId;
    if (query.unitId) where.unitId = query.unitId;
    if (query.legalEntityId) where.legalEntityId = query.legalEntityId;
    if (query.statusId) where.statusId = query.statusId;
    if (query.urgencyId) where.urgencyId = query.urgencyId;

    if (query.dateFrom || query.dateTo) {
        const range: any = {};
        if (query.dateFrom) {
            const d = new Date(query.dateFrom);
            if (!isNaN(d.getTime())) range[Op.gte] = d;
        }
        if (query.dateTo) {
            const d = new Date(query.dateTo);
            if (!isNaN(d.getTime())) range[Op.lte] = d;
        }
        if (Object.keys(range).length) where.createdAt = range;
    }

    if (query.search) {
        const search = String(query.search).trim();
        // Экранируем wildcard'ы Postgres LIKE/ILIKE: иначе пользователь может
        // сделать full-table-scan через "%%%" или whoami через "_" и т.п.
        const escaped = search.replace(/[\\%_]/g, c => `\\${c}`);
        const orConds: any[] = [{ problemDescription: { [Op.iLike]: `%${escaped}%` } }];
        const num = Number(search);
        if (Number.isInteger(num)) orConds.push({ number: num });
        where[Op.and] = [...((where[Op.and] as any[]) || []), { [Op.or]: orConds }];
    }
    return where;
};

const fetchAndCount = async (where: WhereOptions, order: Order, page: number, limit: number, offset: number) => {
    const { rows, count } = await RepairRequest.findAndCountAll({
        where,
        include: lkInclude,
        order,
        limit,
        offset,
        distinct: true,
    });
    return {
        items: rows.map(r => new LkRequestDto(r)),
        total: count,
        page,
        limit,
    };
};

const listForContractor = async (userId: string, query: ListQuery) => {
    const { contractor, objectIds } = await loadUserContext(userId);
    const { page, limit, offset } = parsePagination(query);
    const order = parseOrder(query);

    if (!contractor && objectIds.length === 0) {
        return { items: [], total: 0, page, limit };
    }

    const ownership: any = {};
    const orParts: any[] = [];
    if (contractor) orParts.push({ contractorId: contractor.id });
    if (objectIds.length) orParts.push({ objectId: { [Op.in]: objectIds } });
    ownership[Op.or] = orParts;

    const where = buildBaseFilter(query, ownership);
    return fetchAndCount(where, order, page, limit, offset);
};

const listForCustomer = async (userId: string, query: ListQuery) => {
    const { objectIds } = await loadUserContext(userId);
    const { page, limit, offset } = parsePagination(query);
    const order = parseOrder(query);

    const ownership: any = {
        [Op.or]: [{ createdByUserId: userId }, ...(objectIds.length ? [{ objectId: { [Op.in]: objectIds } }] : [])],
    };

    const where = buildBaseFilter(query, ownership);
    return fetchAndCount(where, order, page, limit, offset);
};

// Pure-предикаты доступа без throw — используются middleware'ом requireRequestAccess,
// чтобы вернуть 403 ДО multer'а (иначе валидация тела отбивает раньше прав).
// Сервисные ensureAccess/ensureWriteAccess реиспользуют их же и оставляют defense-in-depth.
const canRead = (
    request: RepairRequest,
    role: Role,
    ctx: { contractor: Contractor | null; objectIds: string[]; userId: string }
): boolean => {
    if (role === 'ADMIN') return true;
    if (role === 'CONTRACTOR') {
        const own = !!ctx.contractor && request.contractorId === ctx.contractor.id;
        const byObject = !!request.objectId && ctx.objectIds.includes(request.objectId);
        return own || byObject;
    }
    const own = request.createdByUserId === ctx.userId;
    const byObject = !!request.objectId && ctx.objectIds.includes(request.objectId);
    return own || byObject;
};

const canWrite = (
    request: RepairRequest,
    role: Role,
    ctx: { contractor: Contractor | null; objectIds: string[]; userId: string }
): boolean => {
    if (role === 'ADMIN') return true;
    if (role === 'CONTRACTOR') {
        return !!ctx.contractor && request.contractorId === ctx.contractor.id;
    }
    return request.createdByUserId === ctx.userId;
};

// READ-проверка: контрактор видит свои + по объектам, customer — свои + по объектам.
// ADMIN — без ограничений (для отладки/поддержки через LK).
const ensureAccess = async (userId: string, request: RepairRequest, role: Role) => {
    const { contractor, objectIds } = await loadUserContext(userId);
    if (role === 'ADMIN') {
        return { contractor, objectIds };
    }
    if (role === 'CONTRACTOR') {
        const own = contractor && request.contractorId === contractor.id;
        const byObject = !!request.objectId && objectIds.includes(request.objectId);
        if (!own && !byObject) {
            throw new ApiError(httpStatus.FORBIDDEN, 'У вас нет доступа к этой заявке');
        }
        return { contractor, objectIds };
    }
    // CUSTOMER
    const own = request.createdByUserId === userId;
    const byObject = !!request.objectId && objectIds.includes(request.objectId);
    if (!own && !byObject) {
        throw new ApiError(httpStatus.FORBIDDEN, 'У вас нет доступа к этой заявке');
    }
    return { contractor, objectIds };
};

// WRITE-проверка строже READ: только назначенный исполнитель / создатель заявки
// может менять её (комменты, фото). Любого, у кого «доступ через объект»,
// пускать на запись нельзя — иначе посторонний пользователь объекта затрёт чужие данные.
// ADMIN — разрешаем всё (поддержка через LK).
const ensureWriteAccess = async (userId: string, request: RepairRequest, role: Role) => {
    const { contractor, objectIds } = await loadUserContext(userId);
    if (role === 'ADMIN') {
        return { contractor, objectIds };
    }
    if (role === 'CONTRACTOR') {
        if (!contractor || request.contractorId !== contractor.id) {
            throw new ApiError(httpStatus.FORBIDDEN, 'Изменять заявку может только назначенный исполнитель');
        }
        return { contractor, objectIds };
    }
    // CUSTOMER
    if (request.createdByUserId !== userId) {
        throw new ApiError(httpStatus.FORBIDDEN, 'Изменять заявку может только её автор');
    }
    return { contractor, objectIds };
};

const loadRequest = async (requestId: string) => {
    const request = await RepairRequest.findByPk(requestId, { include: lkInclude });
    if (!request) throw new ApiError(httpStatus.NOT_FOUND, 'Заявка не найдена');
    return request;
};

const getOneForRole = async (userId: string, requestId: string, role: Role) => {
    const request = await loadRequest(requestId);
    await ensureAccess(userId, request, role);
    return new LkRequestDto(request);
};

// =====================
// Чат-сообщения (§A design-doc'а)
// =====================

// Cursor — строка вида "<ISO-timestamp>:<UUID>". Парсинг строгий: при невалидной
// строке вернём 400, чтобы фронт не получил «пустой результат» из-за тихой ошибки.
const parseCommentCursor = (cursor: string): { createdAt: Date; id: string } => {
    const idx = cursor.lastIndexOf(':');
    if (idx <= 0 || idx === cursor.length - 1) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Некорректный курсор');
    }
    const ts = cursor.slice(0, idx);
    const id = cursor.slice(idx + 1);
    const date = new Date(ts);
    if (isNaN(date.getTime())) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Некорректный курсор');
    }
    // Лёгкая валидация UUID — defense-in-depth, чтобы не проносить кривые id в SQL.
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRe.test(id)) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Некорректный курсор');
    }
    return { createdAt: date, id };
};

const buildCommentCursor = (comment: RequestComment): string =>
    `${new Date(comment.createdAt).toISOString()}:${comment.id}`;

const listComments = async (requestId: string, query: CommentListQuery, userId: string, role: Role) => {
    const request = await loadRequest(requestId);
    await ensureAccess(userId, request, role);

    const rawLimit = Number(query.limit);
    let limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.floor(rawLimit) : COMMENT_PAGE_DEFAULT;
    if (limit > COMMENT_PAGE_MAX) limit = COMMENT_PAGE_MAX;
    if (limit < 1) limit = 1;

    const where: any = { requestId: request.id };
    if (query.cursor) {
        const cur = parseCommentCursor(query.cursor);
        // Стабильный keyset ASC: (createdAt, id) > cursor.
        where[Op.or] = [
            { createdAt: { [Op.gt]: cur.createdAt } },
            {
                createdAt: cur.createdAt,
                id: { [Op.gt]: cur.id },
            },
        ];
    }

    // limit + 1 — стандартный приём для определения hasMore без лишнего COUNT.
    const rows = await RequestComment.findAll({
        where,
        order: [
            ['createdAt', 'ASC'],
            ['id', 'ASC'],
        ],
        limit: limit + 1,
        include: [{ model: User, as: 'Author' }],
    });

    const hasMore = rows.length > limit;
    const sliced = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor = hasMore ? buildCommentCursor(sliced[sliced.length - 1]) : null;

    return {
        items: sliced.map(c => new RequestCommentDto(c)),
        nextCursor,
        hasMore,
    };
};

// Создаёт RequestComment + write-through legacy `RepairRequest.comment` (для бота
// и старых отчётов, которые читают «последний коммент» из этого поля).
// Шлём оба ws-события: новое COMMENT_CREATE и legacy COMMENT_UPDATE (литерал, до удаления бота).
// Payload — только идентификаторы (без PII), потому что ws сейчас broadcast'ит
// всем без auth (см. F-C3 followup и §A.5 design-doc'а).
const createComment = async (
    userId: string,
    requestId: string,
    role: Role,
    text: string,
    file?: Express.Multer.File | null
) => {
    const request = await loadRequest(requestId);
    await ensureWriteAccess(userId, request, role);

    const user = await User.findByPk(userId);
    if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'Пользователь не найден');

    const attachment = file?.filename ?? null;

    // Транзакция + write-through legacy-cache (correctness-audit B3).
    // Без транзакции два параллельных createComment'а могли затереть RepairRequest.comment
    // не последним по createdAt сообщением, а последним commit'нувшимся — нарушался
    // инвариант «legacy-поле = последний коммент» из design-doc §A.4.
    // Решение: внутри tx создаём коммент → перечитываем последний по
    // (createdAt DESC, id DESC) под FOR UPDATE-блокировкой строки заявки →
    // пишем его текст в legacy-поля. Параллельный insert'ы упорядочиваются по
    // блокировке RepairRequest, и в legacy-поле всегда оседает реально последний.
    const comment = await sequelize.transaction(async t => {
        const created = await RequestComment.create(
            {
                requestId: request.id,
                authorUserId: userId,
                authorRole: user.role,
                text,
                attachment,
            } as any,
            { transaction: t }
        );

        // Блокируем строку заявки, чтобы конкурирующий createComment ждал нас.
        await RepairRequest.findOne({
            where: { id: request.id },
            transaction: t,
            lock: t.LOCK.UPDATE,
        });

        const last = await RequestComment.findOne({
            where: { requestId: request.id },
            order: [
                ['createdAt', 'DESC'],
                ['id', 'DESC'],
            ],
            transaction: t,
        });

        if (last) {
            await RepairRequest.update(
                { comment: last.text, commentAttachment: last.attachment ?? null },
                { where: { id: request.id }, transaction: t }
            );
        }

        return created;
    });

    sendMsg({
        msg: { requestId: request.id, commentId: comment.id, authorUserId: userId },
        event: wsEvents.COMMENT_CREATE,
    } as WsMsgData);

    // Legacy-событие для бота. Литерал, не вынесен в wsEvents — уйдёт вместе
    // с ботом одним коммитом (см. CLAUDE.md «Уход от Telegram»).
    sendMsg({
        msg: { requestId: request.id, comment: text },
        event: 'COMMENT_UPDATE',
    } as WsMsgData);

    // Push другой стороне диалога — текст и формат через notification.service
    // (UI-словарь, единый источник для push и TG, см. config/notificationLabels.ts).
    // Текст комментария в payload не уходит (PII), юзер прочитает в чате.
    await notificationService.notifyCommentChanged(request, role, userId);

    // Подгружаем Author для DTO. Можно было руками подложить user, но повторный
    // findByPk проще читать и согласован с DTO-форматом.
    const fresh = await RequestComment.findByPk(comment.id, {
        include: [{ model: User, as: 'Author' }],
    });
    if (!fresh) throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Сообщение не сохранено');
    return new RequestCommentDto(fresh);
};

// =====================
// Конец чат-сообщений
// =====================

// Дописывает фотографии к заявке. Поле `fileName` исторически хранит либо
// одну строку, либо JSON-массив строк — поэтому здесь нормализуем оба варианта.
const addPhotos = async (userId: string, requestId: string, role: Role, files: Express.Multer.File[]) => {
    if (!files || files.length === 0) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Не передано ни одного файла');
    }
    const request = await loadRequest(requestId);
    await ensureWriteAccess(userId, request, role);

    const current = normalizeFileNames(request.fileName as unknown as string | null);
    const merged = [...current, ...files.map(f => f.filename)];
    if (merged.length > FILE_LIMIT) {
        throw new ApiError(httpStatus.BAD_REQUEST, `Превышен лимит: не более ${FILE_LIMIT} фотографий на заявку`);
    }

    const value = merged.length > 1 ? JSON.stringify(merged) : merged[0];
    await request.update({ fileName: value });
    return new LkRequestDto(request);
};

// State-machine для подрядчика: разрешены только NEW_REQUEST→AT_WORK и AT_WORK→DONE.
// IRRELEVANT/FALSE исторически выставляет менеджер через админ-интерфейс — подрядчику
// эти переходы недоступны, чтобы он не мог «закрыть» свои заявки как «неактуальные».
const CONTRACTOR_TRANSITIONS: Record<number, number[]> = {
    [statuses.NEW_REQUEST]: [statuses.AT_WORK],
    [statuses.AT_WORK]: [statuses.DONE],
};

const setStatusForContractor = async (userId: string, requestId: string, statusNumber: number, role: Role) => {
    const request = await loadRequest(requestId);
    const { contractor } = await ensureAccess(userId, request, role);

    // Эту операцию выполняет только назначенный исполнитель — даже ADMIN не может,
    // потому что у него для этого есть админ-интерфейс заявок.
    if (role !== 'CONTRACTOR' || !contractor || request.contractorId !== contractor.id) {
        throw new ApiError(httpStatus.FORBIDDEN, 'Эту операцию может выполнять только назначенный исполнитель');
    }

    const allowed = CONTRACTOR_TRANSITIONS[request.status] ?? [];
    if (!allowed.includes(statusNumber)) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Недопустимый переход статуса заявки');
    }

    if (statusNumber === statuses.DONE && !request.checkPhoto) {
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            'Закрытие заявки требует фото-подтверждения. Загрузите фото после ремонта.'
        );
    }

    const oldStatus = request.status;
    const updates: any = { status: statusNumber };
    if (statusNumber === statuses.DONE) updates.completeDate = new Date();
    await request.update(updates);

    sendMsg({
        msg: { requestId: request.id, newStatus: statusNumber, oldStatus },
        event: wsEvents.STATUS_UPDATE,
    } as WsMsgData);

    // Push другой стороне (создателю заявки) с тем же текстом, что у TG-нотификации.
    // Источник — сам подрядчик, исключаем его, чтобы не пушить self.
    await notificationService.notifyStatusChanged(request, statusNumber, { excludeUserId: userId });

    return new LkRequestDto(request);
};

const uploadCheckPhoto = async (userId: string, requestId: string, file: Express.Multer.File, role: Role) => {
    if (!file) throw new ApiError(httpStatus.BAD_REQUEST, 'Файл не передан');
    const request = await loadRequest(requestId);
    const { contractor } = await ensureAccess(userId, request, role);
    if (role !== 'CONTRACTOR' || !contractor || request.contractorId !== contractor.id) {
        throw new ApiError(httpStatus.FORBIDDEN, 'Эту операцию может выполнять только назначенный исполнитель');
    }
    await request.update({ checkPhoto: file.filename });
    return new LkRequestDto(request);
};

type CreateRequestBody = {
    objectId: string;
    problemDescription: string;
    urgencyId: string;
};

const createForCustomer = async (userId: string, body: CreateRequestBody, files: Express.Multer.File[] = []) => {
    const { objectIds } = await loadUserContext(userId);
    if (!objectIds.includes(body.objectId)) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Объект не входит в список ваших доступных объектов');
    }

    const objectDir = await ObjectDir.findByPk(body.objectId, { include: [{ model: Unit }, { model: LegalEntity }] });
    if (!objectDir) throw new ApiError(httpStatus.BAD_REQUEST, 'Объект не найден');
    if (!objectDir.unitId) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'У объекта не указан бизнес-юнит');
    }
    if (!objectDir.legalEntityId) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'У объекта не указано юрлицо');
    }

    const urgency = await Urgency.findByPk(body.urgencyId);
    if (!urgency) throw new ApiError(httpStatus.BAD_REQUEST, 'Срочность не найдена');

    let fileName: string | null = null;
    const filenames = files.map(f => f.filename);
    if (filenames.length === 1) fileName = filenames[0];
    else if (filenames.length > 1) fileName = JSON.stringify(filenames);

    const created = await RepairRequest.create({
        objectId: body.objectId,
        unitId: objectDir.unitId,
        legalEntityId: objectDir.legalEntityId,
        problemDescription: body.problemDescription,
        urgency: urgency.name,
        urgencyId: urgency.id,
        status: statuses.NEW_REQUEST,
        daysAtWork: 0,
        builder: 'Укажите подрядчика',
        fileName,
        createdByUserId: userId,
        createdBy: null,
        number: 0,
    });

    sendMsg({
        msg: { requestId: created.id, objectId: created.objectId },
        event: 'REQUEST_CREATE',
    } as WsMsgData);

    // Зеркало TG-нотификации «новая заявка» для менеджеров — тот же текст
    // юзер видит и в боте, и в push.
    await notificationService.notifyRequestCreated(created);

    const fresh = await loadRequest(created.id);
    return new LkRequestDto(fresh);
};

// Хелпер для контроллера: разрешить query.role только если он совпадает с ролью
// текущего юзера — иначе 403. ADMIN может использовать любой режим (отладка).
// requestedRole здесь — только 'CONTRACTOR' | 'CUSTOMER' (это режим отображения списка),
// 'ADMIN' как режим списка не поддерживается.
const resolveListRole = (userRole: number, requestedRole: 'CONTRACTOR' | 'CUSTOMER'): 'CONTRACTOR' | 'CUSTOMER' => {
    if (userRole === roles.ADMIN) return requestedRole;
    if (requestedRole === 'CONTRACTOR' && userRole === roles.CONTRACTOR) return 'CONTRACTOR';
    if (requestedRole === 'CUSTOMER' && userRole === roles.CUSTOMER) return 'CUSTOMER';
    throw new ApiError(httpStatus.FORBIDDEN, 'Роль в запросе не совпадает с ролью пользователя');
};

export default {
    getMe,
    getMyObjectsFull,
    loadUserContext,
    canRead,
    canWrite,
    listForContractor,
    listForCustomer,
    getOneForRole,
    listComments,
    createComment,
    addPhotos,
    setStatusForContractor,
    uploadCheckPhoto,
    createForCustomer,
    resolveListRole,
};
