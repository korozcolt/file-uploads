import authRouter from './routes/auth';
import cors from 'cors';
// swagger docs
import docsRouter from './routes/docs';
import dotenv from 'dotenv';
import express from 'express';
import healthRouter from './routes/health';
import helmet from 'helmet';
import imagesRouter from './routes/images';
import morgan from 'morgan';
import projectsRouter from './routes/projects';
import rateLimit from 'express-rate-limit';
import uploadRouter from './routes/upload';

dotenv.config();

const app = express();

// Trust proxy headers from nginx/traefik (required for Dokploy deployment)
app.set('trust proxy', true);

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100
  })
);


app.use('/health', healthRouter);
app.use('/auth', authRouter);
app.use('/upload', uploadRouter);
app.use('/images', imagesRouter);
app.use('/projects', projectsRouter);

app.use('/docs', docsRouter);
app.get('/docs.json', (_req, res) => res.json(require('./docs/openapi.json')));

app.get('/', (_, res) => res.json({ ok: true }));

// error handler
app.use((err: any, _req: any, res: any, _next: any) => {
  if (err && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'file too large' });
  }
  console.error(err);
  return res.status(500).json({ error: 'internal error' });
});

export default app;
