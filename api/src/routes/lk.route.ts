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

const ALLOWED_IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png']);
const ALLOWED_VIDEO_EXTS = new Set(['.mp4']);
const ALLOWED_IMAGE_MIMES = new Set(['image/jpeg', 'image/png']);
const ALLOWED_VIDEO_MIMES = new Set(['video/mp4']);

const safeFilename = (file: Express.Multer.File): string => {
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

router.get(
    '/requests/:id/comments',
    validateUuidParam('id'),
    requireRequestAccess('id', 'read'),
    validator(commentListQuerySchema),
    lkController.listComments
);

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

router.post('/me/tg-binding/init', verifyAnyRole(['CONTRACTOR']), lkTgBindingRateLimiter, lkController.tgBindingInit);

router.get('/me/tg-binding/status', verifyAnyRole(['CONTRACTOR']), lkController.tgBindingStatus);

router.delete('/me/tg-binding', verifyAnyRole(['CONTRACTOR']), lkController.tgBindingUnbind);

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
