import { Router } from 'express';
import requestController from '../controllers/request.controller';
import { v4 } from 'uuid';
import multer from 'multer';
import path from 'path';
import Joi from 'joi';
import { validator } from '../middlewares/validator';
import { authenticateWebOrMaster, requireActorRoles, requireWebActorRoles } from '../middlewares/authenticate-actor';
import roles from '../config/roles';
import {
    attachRequestScope,
    requireBulkRequestAccess,
    requireObjectBodyAccess,
    requireRequestBodyAccess,
    requireRequestParamAccess,
} from '../middlewares/require-admin-request-access';

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
        statusId: Joi.string().optional().allow(null),
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

router.use(authenticateWebOrMaster, requireActorRoles(roles.ADMIN, roles.MANAGER), attachRequestScope);

router.route('/stats').get(requestController.getStat);
router
    .route('/')
    .get(requestController.getAll)
    .post(uploadImageOrVideo.single('file'), requireObjectBodyAccess('objectId'), requestController.create);
router.route('/without-photo').post(requireObjectBodyAccess('objectId'), requestController.createWithoutPhoto);
router
    .route('/multiple-photos')
    .post(
        uploadMultipleImages.array('file', 10),
        requireObjectBodyAccess('objectId'),
        requestController.createWithMultiplePhotos
    );
router.route('/count').get(requestController.getRequestCountController);
router.route('/:requestId').get(requireRequestParamAccess('requestId'), requestController.getOne);
router.route('/:requestId/delete').delete(requireRequestParamAccess('requestId'), requestController.deleteRequest);
router
    .route('/:requestId/update')
    .patch(validator(requestUpdateSchema), requireRequestParamAccess('requestId'), requestController.update);

router.route('/remove/contractor').patch(requireRequestBodyAccess('requestId'), requestController.removeContractor);
router
    .route('/remove/extContractor')
    .patch(requireRequestBodyAccess('requestId'), requestController.removeExtContractor);

router.route('/set/extContractor').patch(requireRequestBodyAccess('requestId'), requestController.setExtContractor);
router.route('/set/contractor').patch(requireRequestBodyAccess('requestId'), requestController.setContractor);
router.route('/set/manager').patch(requireRequestBodyAccess('requestId'), requestController.setManager);
router.route('/set/status').patch(requireRequestBodyAccess('requestId'), requestController.setStatus);
router.route('/set/comment').patch(requireRequestBodyAccess('requestId'), requestController.setComment);
router
    .route('/set/commentAttachment')
    .patch(
        uploadImageOrVideo.single('file'),
        requireRequestBodyAccess('requestId'),
        requestController.setCommentAttachment
    );

router.route('/delete/bulk').post(requireBulkRequestAccess('ids'), requestController.bulkDelete);
router.route('/status/bulk').patch(requireBulkRequestAccess('ids'), requestController.bulkStatus);
router.route('/urgency/bulk').patch(requireBulkRequestAccess('ids'), requestController.bulkUrgency);
router.route('/contractor/bulk').patch(requireBulkRequestAccess('ids'), requestController.bulkContractor);

router.route('/customer/:tgUserId').get(requestController.getCustomersRequests);

router.route('/objects/:tgUserId').get(requestController.getRequestsByObjects);

router
    .route('/add/check/:requestId')
    .patch(uploadImage.single('file'), requireRequestParamAccess('requestId'), requestController.addCheck);

router.route('/copy/:requestId').post(requireRequestParamAccess('requestId'), requestController.copy);

router.route('/changeUrgency').post(requestController.changeUrgency);

router.route('/changeStatus').post(requestController.changeStatus);

router.route('/files/:requestId').get(requireRequestParamAccess('requestId'), requestController.getCountFilesRequest);

router
    .route('/directoryCategory/:requestId')
    .post(requireRequestParamAccess('requestId'), requestController.setNewDirectoryCategory);

router.route('/actual/:tgUserId/:unitId/:objectId?').get(requestController.getActualRequestsByObjectId);

router.route('/migrate/manager-ids').post(requireWebActorRoles(roles.ADMIN), requestController.migrateManagerData);
router.route('/validate/manager-ids').post(requireWebActorRoles(roles.ADMIN), requestController.validateManagerData);

export default router;
