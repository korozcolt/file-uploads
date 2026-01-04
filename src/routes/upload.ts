import { Router } from 'express';
import adminAuth from '../middleware/adminAuth';
import fileTypeValidator from '../middleware/fileTypeValidator';
import multer from 'multer';
import projectValidator from '../middleware/projectValidator';
import { uploadHandler } from '../modules/upload/upload.controller';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: Number(process.env.MAX_UPLOAD_SIZE_BYTES) || 5 * 1024 * 1024 } });

router.post('/', adminAuth, upload.single('file'), projectValidator, fileTypeValidator, uploadHandler);

export default router;
