import { Router } from 'express';
import requestController from '../controllers/request.controller';
import { v4 } from 'uuid';
import multer from 'multer';
import path from 'path';
import verifyToken from '../middlewares/verify-token';

const router = Router();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads');
    },
    filename: function (req, file, cb) {
        cb(null, `${v4()}.${file.originalname.split('.')[1]}`);
    },
});

const upload = multer({
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

router.route('/').get(requestController.getAll).post(upload.single('file'), requestController.create);
router.route('/:requestId').get(requestController.getOne);
router.route('/set/contractor').patch(verifyToken.auth, requestController.setContractor);
router.route('/remove/contractor').patch(requestController.removeContractor);
router.route('/set/status').patch(verifyToken.auth, requestController.setStatus);
router.route('/:requestId/delete').delete(verifyToken.auth, requestController.deleteRequest);
router.route('/:requestId/update').put(verifyToken.auth, requestController.update);
router.route('/customer/:tgUserId').get(requestController.getCustomersRequests);
export default router;
