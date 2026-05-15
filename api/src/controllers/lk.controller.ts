import catchAsync from '../utils/catchAsync';
import lkService from '../services/lk.service';
import userTgBindingService from '../services/userTgBinding.service';
import pushNotificationService from '../services/pushNotification.service';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';
import roles, { mapRoles } from '../config/roles';

type LkRole = 'CONTRACTOR' | 'CUSTOMER' | 'ADMIN';

// req.user формируется в auth-middleware из access-токена. Хранит id и role
// (числовой) — берём оба, чтобы не дёргать БД ради роли.
const getCurrent = (req: any): { userId: string; roleNumber: number; roleName: string } => {
    const u = req.user || {};
    if (!u.id) throw new ApiError(httpStatus.UNAUTHORIZED, 'Пользователь не авторизован');
    const roleNumber: number = typeof u.role === 'number' ? u.role : (roles as Record<string, number>)[u.role] || 0;
    const roleName = (mapRoles as Record<number, string>)[roleNumber] || String(roleNumber);
    return { userId: u.id, roleNumber, roleName };
};

// Централизованно мапим числовую роль в строковую для сервиса. Раньше тут была
// бинарная развилка `CONTRACTOR : CUSTOMER`, из-за которой ADMIN(=2) попадал в
// CUSTOMER и ломал доступ. Сейчас ADMIN — отдельная ветка.
const resolveRole = (req: any): LkRole => {
    const { roleNumber } = getCurrent(req);
    if (roleNumber === roles.ADMIN) return 'ADMIN';
    if (roleNumber === roles.CONTRACTOR) return 'CONTRACTOR';
    return 'CUSTOMER';
};

const getMe = catchAsync(async (req, res) => {
    const { userId } = getCurrent(req);
    const data = await lkService.getMe(userId);
    res.json(data);
});

const getMyObjects = catchAsync(async (req, res) => {
    const { userId } = getCurrent(req);
    const objects = await lkService.getMyObjectsFull(userId);
    res.json(objects);
});

const list = catchAsync(async (req, res) => {
    const { userId, roleNumber } = getCurrent(req);
    const requested = String(req.query.role || '').toUpperCase();
    if (requested !== 'CONTRACTOR' && requested !== 'CUSTOMER') {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Параметр role обязателен и должен быть contractor или customer');
    }
    const role = lkService.resolveListRole(roleNumber, requested as 'CONTRACTOR' | 'CUSTOMER');
    const data =
        role === 'CONTRACTOR'
            ? await lkService.listForContractor(userId, req.query)
            : await lkService.listForCustomer(userId, req.query);
    res.json(data);
});

const getOne = catchAsync(async (req, res) => {
    const { userId } = getCurrent(req);
    const role = resolveRole(req);
    const dto = await lkService.getOneForRole(userId, req.params.id, role);
    res.json(dto);
});

const create = catchAsync(async (req, res) => {
    const { userId, roleNumber } = getCurrent(req);
    const files = ((req as any).files as Express.Multer.File[]) || [];
    const dto = await lkService.createForCustomer(userId, req.body, files, roleNumber);
    res.status(httpStatus.CREATED).json(dto);
});

// GET /lk/requests/:id/comments — cursor-пагинация чата.
const listComments = catchAsync(async (req, res) => {
    const { userId } = getCurrent(req);
    const role = resolveRole(req);
    const data = await lkService.listComments(req.params.id, req.query, userId, role);
    res.json(data);
});

// POST /lk/requests/:id/comments — append + write-through legacy `RepairRequest.comment`.
// См. design-doc §A.4 «Решение по совместимости»: семантика overwrite заменена на append,
// старое поле остаётся как кеш «последнего сообщения» для бота/отчётов.
const createComment = catchAsync(async (req, res) => {
    const { userId } = getCurrent(req);
    const role = resolveRole(req);
    const file = (req as any).file as Express.Multer.File | undefined;
    const dto = await lkService.createComment(userId, req.params.id, role, req.body.text, file ?? null);
    res.status(httpStatus.CREATED).json(dto);
});

const addPhotos = catchAsync(async (req, res) => {
    const { userId } = getCurrent(req);
    const role = resolveRole(req);
    const files = ((req as any).files as Express.Multer.File[]) || [];
    const dto = await lkService.addPhotos(userId, req.params.id, role, files);
    res.json(dto);
});

const setStatus = catchAsync(async (req, res) => {
    const { userId } = getCurrent(req);
    const role = resolveRole(req);
    const dto = await lkService.setStatusForContractor(userId, req.params.id, req.body.statusNumber, role);
    res.json(dto);
});

const uploadCheckPhoto = catchAsync(async (req, res) => {
    const { userId } = getCurrent(req);
    const role = resolveRole(req);
    const file = (req as any).file as Express.Multer.File;
    const dto = await lkService.uploadCheckPhoto(userId, req.params.id, file, role);
    res.json(dto);
});

const updateExitDate = catchAsync(async (req, res) => {
    const { userId } = getCurrent(req);
    const role = resolveRole(req);
    // exitDate = ISO-строка либо null/undefined для сброса.
    const exitDate = req.body?.exitDate ?? null;
    const dto = await lkService.updateExitDate(userId, req.params.id, exitDate, role);
    res.json(dto);
});

// =====================
// Self-binding TG_ID (см. design-doc §D)
// =====================

const tgBindingInit = catchAsync(async (req, res) => {
    const { userId, roleNumber } = getCurrent(req);
    // ADMIN не привязывает себе TG через ЛК — у него есть админ-flow `tgUsers/syncManager`.
    if (roleNumber === roles.ADMIN) {
        throw new ApiError(httpStatus.FORBIDDEN, 'Привязка Telegram через ЛК недоступна для администратора');
    }
    const data = await userTgBindingService.init(userId);
    // Plaintext отдаётся ОДИН РАЗ — фронт показывает кнопку «Открыть Telegram» с deepLink.
    res.json({
        deepLink: data.deepLink,
        expiresAt: data.expiresAt.toISOString(),
    });
});

const tgBindingStatus = catchAsync(async (req, res) => {
    const { userId } = getCurrent(req);
    const data = await userTgBindingService.status(userId);
    res.json(data);
});

const tgBindingUnbind = catchAsync(async (req, res) => {
    const { userId } = getCurrent(req);
    await userTgBindingService.unbind(userId);
    res.status(httpStatus.NO_CONTENT).send();
});

// =====================
// Web Push (см. design-doc 2026-05-07-web-push-design.md §3-§4)
// =====================

const pushVapidKey = catchAsync(async (_req, res) => {
    const publicKey = pushNotificationService.getVapidPublicKey();
    res.json({ publicKey });
});

const pushSubscribe = catchAsync(async (req, res) => {
    const { userId } = getCurrent(req);
    const data = await pushNotificationService.subscribe(userId, req.body);
    res.status(httpStatus.CREATED).json(data);
});

const pushUnsubscribe = catchAsync(async (req, res) => {
    const { userId } = getCurrent(req);
    await pushNotificationService.unsubscribe(userId, req.body.endpoint);
    res.status(httpStatus.NO_CONTENT).send();
});

const pushStatus = catchAsync(async (req, res) => {
    const { userId } = getCurrent(req);
    const data = await pushNotificationService.status(userId);
    res.json(data);
});

const pushTest = catchAsync(async (req, res) => {
    const { userId } = getCurrent(req);
    const data = await pushNotificationService.sendTest(userId);
    res.json(data);
});

export default {
    getMe,
    getMyObjects,
    list,
    getOne,
    create,
    listComments,
    createComment,
    addPhotos,
    setStatus,
    uploadCheckPhoto,
    updateExitDate,
    tgBindingInit,
    tgBindingStatus,
    tgBindingUnbind,
    pushVapidKey,
    pushSubscribe,
    pushUnsubscribe,
    pushStatus,
    pushTest,
};
