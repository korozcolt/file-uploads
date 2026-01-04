import { getImageHandler, getImageMetaHandler, listImagesHandler, signImageHandler } from '../modules/images/images.controller';

import { Router } from 'express';

const router = Router();

router.post('/:id/sign', signImageHandler);
router.get('/:id', getImageHandler);
router.get('/', listImagesHandler);
router.get('/:id/meta', getImageMetaHandler);

export default router;
