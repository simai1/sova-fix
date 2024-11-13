import { Router } from 'express';
import requestController from '../controllers/request.controller';
import { v4 } from 'uuid';
import multer from 'multer';
import path from 'path';

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

router.route('/').get(requestController.getAll).post(uploadImageOrVideo.single('file'), requestController.create);
router.route('/:requestId').get(requestController.getOne);
router.route('/:requestId/delete').delete(requestController.deleteRequest);
router.route('/:requestId/update').patch(requestController.update);

router.route('/remove/contractor').patch(requestController.removeContractor);
router.route('/remove/extContractor').patch(requestController.removeExtContractor);

router.route('/set/extContractor').patch(requestController.setExtContractor);
router.route('/set/contractor').patch(requestController.setContractor);
router.route('/set/status').patch(requestController.setStatus);
router.route('/set/comment').patch(requestController.setComment);
router.route('/set/commentAttachment').patch(uploadImageOrVideo.single('file'), requestController.setCommentAttachment);

router.route('/delete/bulk').post(requestController.bulkDelete);
router.route('/status/bulk').patch(requestController.bulkStatus);
router.route('/urgency/bulk').patch(requestController.bulkUrgency);
router.route('/contractor/bulk').patch(requestController.bulkContractor);

router.route('/customer/:tgUserId').get(requestController.getCustomersRequests);
router.route('/add/check/:requestId').patch(uploadImage.single('file'), requestController.addCheck);
export default router;
