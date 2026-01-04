import { Router } from 'express';
import openapi from '../docs/openapi.json';
import swaggerUi from 'swagger-ui-express';

const router = Router();

router.use('/', swaggerUi.serve, swaggerUi.setup(openapi));

// Expose raw spec for consumers
router.get('/json', (_req, res) => {
  res.json(openapi);
});

export default router;
