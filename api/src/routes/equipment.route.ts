import { Router } from 'express';
import multer from 'multer';
import { v4 } from 'uuid';
import path from 'path';
import equipmentController from '../controllers/equipment.controller';

const router = Router();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads');
    },
    filename: function (req, file, cb) {
        cb(null, `${v4()}.${file.originalname.split('.')[1]}`);
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

router.route('/').get(equipmentController.getAll).post(uploadImage.single('file'), equipmentController.create);
router.route('/:equipmentId/photo').patch(uploadImage.single('file'), equipmentController.updatePhoto);
router.route('/:equipmentId/tech').post(equipmentController.techServiceDo);
router
    .route('/:equipmentId')
    .get(equipmentController.getOne)
    .delete(equipmentController.destroy)
    .patch(equipmentController.update);

export default router;
