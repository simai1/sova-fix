import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 } from 'uuid';
import mimeTypes from 'mime-types';
import verifyToken from '../middlewares/verify-token';
import verifyAnyRole from '../middlewares/verify-any-role';
import lkController from '../controllers/lk.controller';
import { validator } from '../middlewares/validator';
import { validateUuidParam } from '../middlewares/validate-uuid-param';
import { requireRequestAccess } from '../middlewares/require-request-access';
import {
    lkCreateRequestRateLimiter,
    lkAddCommentRateLimiter,
    lkTgBindingRateLimiter,
    lkPushSubscribeRateLimiter,
    lkPushTestRateLimiter,
} from '../middlewares/rate-limit';
import {
    listQuerySchema,
    createRequestSchema,
    statusSchema,
    exitDateSchema,
    addCommentSchema,
    commentListQuerySchema,
    requestIdParamSchema,
    pushSubscribeSchema,
    pushUnsubscribeSchema,
} from '../validations/lk.validation';

const router = Router();

// Расширения и MIME-типы держим синхронно: и то и другое проверяем в fileFilter,
// но имя файла строим из MIME (не доверяем расширению из originalname — клиент
// может прислать .jpg с реальным контентом video/mp4).
const ALLOWED_IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png']);
const ALLOWED_VIDEO_EXTS = new Set(['.mp4']);
const ALLOWED_IMAGE_MIMES = new Set(['image/jpeg', 'image/png']);
const ALLOWED_VIDEO_MIMES = new Set(['video/mp4']);

const safeFilename = (file: Express.Multer.File): string => {
    // Берём расширение из MIME, не из originalname — иначе .jpg-обёртка может
    // обмануть последующие потребители (например, image-обработчики).
    const ext = mimeTypes.extension(file.mimetype) || 'bin';
    return `${v4()}.${ext}`;
};

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, './uploads'),
    filename: (_req, file, cb) => cb(null, safeFilename(file)),
});

const fileSize = 10 * 1024 * 1024;
const fieldSize = 64 * 1024;
const limits = { fileSize, fieldSize };

// Multer fileFilter с русскоязычными сообщениями.
const imageOrVideoFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const okExt = ALLOWED_IMAGE_EXTS.has(ext) || ALLOWED_VIDEO_EXTS.has(ext);
    const okMime = ALLOWED_IMAGE_MIMES.has(file.mimetype) || ALLOWED_VIDEO_MIMES.has(file.mimetype);
    if (!okExt || !okMime) {
        return cb(new Error('Допустимы только изображения и видео JPG/JPEG/PNG/MP4'));
    }
    cb(null, true);
};

const imageOnlyFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const okExt = ALLOWED_IMAGE_EXTS.has(ext);
    const okMime = ALLOWED_IMAGE_MIMES.has(file.mimetype);
    if (!okExt || !okMime) {
        return cb(new Error('Допустимы только изображения JPG/JPEG/PNG'));
    }
    cb(null, true);
};

const imageOrVideo = multer({ storage, limits, fileFilter: imageOrVideoFilter });
const imageOnly = multer({ storage, limits, fileFilter: imageOnlyFilter });

// OBSERVER добавлен в общий guard ради push-эндпоинтов /me/push/* (см. §3 web-push-design),
// которые доступны всем ролям ЛК. Эндпоинты, которые остались CONTRACTOR-only (tg-binding),
// явно ставят свой verifyAnyRole(['CONTRACTOR']) ниже и фильтруют OBSERVER на уровне роута.
router.use(verifyToken.auth, verifyAnyRole(['CONTRACTOR', 'CUSTOMER', 'ADMIN', 'OBSERVER']));

router.get('/me', lkController.getMe);

router.get('/objects/my', lkController.getMyObjects);

router.get('/requests', validator(listQuerySchema), lkController.list);

router.get('/requests/:id', validateUuidParam('id'), validator(requestIdParamSchema), lkController.getOne);

router.post(
    '/requests',
    verifyAnyRole(['CUSTOMER', 'ADMIN']),
    lkCreateRequestRateLimiter,
    imageOnly.array('files', 10),
    validator(createRequestSchema),
    lkController.create
);

// GET чата заявки. read-доступ — тот же, что для GET /lk/requests/:id.
router.get(
    '/requests/:id/comments',
    validateUuidParam('id'),
    requireRequestAccess('id', 'read'),
    validator(commentListQuerySchema),
    lkController.listComments
);

// POST нового сообщения в чат. Семантика — append (а не overwrite legacy-поля).
// Гард прав ставим ДО multer, иначе multer/Joi ловят 400 «нет файла»
// раньше, чем доходит до сервисной проверки доступа, и тест получает 400 вместо 403.
router.post(
    '/requests/:id/comments',
    validateUuidParam('id'),
    requireRequestAccess('id', 'write'),
    lkAddCommentRateLimiter,
    imageOrVideo.single('file'),
    validator(addCommentSchema),
    lkController.createComment
);

router.post(
    '/requests/:id/photos',
    validateUuidParam('id'),
    requireRequestAccess('id', 'write'),
    imageOnly.array('files', 10),
    validator(requestIdParamSchema),
    lkController.addPhotos
);

router.patch(
    '/requests/:id/status',
    validateUuidParam('id'),
    verifyAnyRole(['CONTRACTOR', 'ADMIN']),
    requireRequestAccess('id', 'write'),
    validator(statusSchema),
    lkController.setStatus
);

router.post(
    '/requests/:id/check-photo',
    validateUuidParam('id'),
    verifyAnyRole(['CONTRACTOR', 'ADMIN']),
    requireRequestAccess('id', 'write'),
    imageOnly.single('file'),
    validator(requestIdParamSchema),
    lkController.uploadCheckPhoto
);

router.patch(
    '/requests/:id/exit-date',
    validateUuidParam('id'),
    verifyAnyRole(['CONTRACTOR', 'ADMIN']),
    requireRequestAccess('id', 'write'),
    validator(exitDateSchema),
    lkController.updateExitDate
);

// =====================
// Self-binding TG_ID (см. design-doc §D)
// =====================

// TG-binding предусмотрен только для CONTRACTOR (correctness-audit H5):
// бот шлёт уведомления только контракторам через Contractor.tgUserId, у CUSTOMER
// связи на уровне User-модели нет, и status() для CUSTOMER всегда вернул бы
// linked:false — UX «привязал, но ничего не изменилось». Закрываем endpoints
// CUSTOMER явным 403; если потребуется TG-привязка для CUSTOMER, вводим
// отдельную таблицу UserTgLink — отдельный feature-PR.
router.post('/me/tg-binding/init', verifyAnyRole(['CONTRACTOR']), lkTgBindingRateLimiter, lkController.tgBindingInit);

router.get('/me/tg-binding/status', verifyAnyRole(['CONTRACTOR']), lkController.tgBindingStatus);

router.delete('/me/tg-binding', verifyAnyRole(['CONTRACTOR']), lkController.tgBindingUnbind);

// =====================
// Web Push (см. design-doc 2026-05-07-web-push-design.md §3)
// =====================
//
// Push-эндпоинты доступны всем ролям ЛК (CONTRACTOR/CUSTOMER/ADMIN/OBSERVER) —
// верхний router.use(...) уже пропускает все четыре. Дополнительный verifyAnyRole
// здесь не нужен; rate-limit и Joi-валидатор стоят там, где это критично.
router.get('/me/push/vapid-public-key', lkController.pushVapidKey);

router.post(
    '/me/push/subscribe',
    lkPushSubscribeRateLimiter,
    validator(pushSubscribeSchema),
    lkController.pushSubscribe
);

router.delete('/me/push/subscribe', validator(pushUnsubscribeSchema), lkController.pushUnsubscribe);

router.get('/me/push/status', lkController.pushStatus);

router.post('/me/push/test', lkPushTestRateLimiter, lkController.pushTest);

export default router;
