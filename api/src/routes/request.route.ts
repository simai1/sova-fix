import { Router } from 'express';
import requestController from '../controllers/request.controller';
import { v4 } from 'uuid';
import multer from 'multer';
import path from 'path';
import Joi from 'joi';
import { validator } from '../middlewares/validator';

const router = Router();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads');
    },
    filename: function (req, file, cb) {
        cb(null, `${v4()}.${file.originalname.split('.')[1]}`);
    },
});

const uploadImageOrVideo = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const acceptedExtensionsList = ['.jpg', '.jpeg', '.png', '.mp4'];
        const extname = path.extname(file.originalname).toLowerCase();
        if (acceptedExtensionsList.includes(extname)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file extension'));
        }
    },
});

const uploadImage = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const acceptedExtensionsList = ['.jpg', '.jpeg', '.png'];
        const extname = path.extname(file.originalname).toLowerCase();
        if (acceptedExtensionsList.includes(extname)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file extension'));
        }
    },
});

const uploadMultipleImages = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const acceptedExtensionsList = ['.jpg', '.jpeg', '.png'];
        const extname = path.extname(file.originalname).toLowerCase();
        if (acceptedExtensionsList.includes(extname)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file extension'));
        }
    },
});

const requestUpdateSchema = Joi.object({
    body: Joi.object({
        objectId: Joi.string().optional(),
        problemDescription: Joi.string().optional(),
        urgency: Joi.string().optional(),
        repairPrice: Joi.number().allow(null).optional(),
        comment: Joi.string().allow(null).optional(),
        itineraryOrder: Joi.number().optional(),
        contractorId: Joi.string().optional(),
        status: Joi.number().optional(),
        builder: Joi.string().optional(),
        planCompleteDate: Joi.date().optional().allow(null),
        managerTgId: Joi.string().optional(),
        urgencyId: Joi.string().optional().allow(null),
    }).unknown(true),
    params: Joi.object({
        requestId: Joi.string().required(),
    }),
    query: Joi.object().unknown(true),
});

router.route('/stats').get(requestController.getStat);
router.route('/').get(requestController.getAll).post(uploadImageOrVideo.single('file'), requestController.create);
router.route('/without-photo').post(requestController.createWithoutPhoto);
router.route('/multiple-photos').post(uploadMultipleImages.array('file', 10), requestController.createWithMultiplePhotos);
router.route('/:requestId').get(requestController.getOne);
router.route('/:requestId/delete').delete(requestController.deleteRequest);
router.route('/:requestId/update').patch(validator(requestUpdateSchema), requestController.update);

router.route('/remove/contractor').patch(requestController.removeContractor);
router.route('/remove/extContractor').patch(requestController.removeExtContractor);

router.route('/set/extContractor').patch(requestController.setExtContractor);
router.route('/set/contractor').patch(requestController.setContractor);
router.route('/set/manager').patch(requestController.setManager);
router.route('/set/status').patch(requestController.setStatus);
router.route('/set/comment').patch(requestController.setComment);
router.route('/set/commentAttachment').patch(uploadImageOrVideo.single('file'), requestController.setCommentAttachment);

router.route('/delete/bulk').post(requestController.bulkDelete);
router.route('/status/bulk').patch(requestController.bulkStatus);
router.route('/urgency/bulk').patch(requestController.bulkUrgency);
router.route('/contractor/bulk').patch(requestController.bulkContractor);

router.route('/customer/:tgUserId').get(requestController.getCustomersRequests);

// Маршрут для получения заявок по объектам, к которым у пользователя есть доступ
router.route('/objects/:tgUserId').get(requestController.getRequestsByObjects);

router.route('/add/check/:requestId').patch(uploadImage.single('file'), requestController.addCheck);

router.route('/copy/:requestId').post(requestController.copy);

router.route('/changeUrgency').post(requestController.changeUrgency)

router.route('/changeStatus').post(requestController.changeStatus)

// Migration endpoints (should be protected in production)
router.route('/migrate/manager-ids').post(requestController.migrateManagerData);
router.route('/validate/manager-ids').post(requestController.validateManagerData);

export default router;
