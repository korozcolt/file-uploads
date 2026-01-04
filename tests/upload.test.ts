import app from '../src/app';
import db from '../src/db';
import fs from 'fs';
import path from 'path';
import request from 'supertest';

// set small max size for tests
process.env.MAX_UPLOAD_SIZE_BYTES = String(200 * 1024); // 200KB


const samplePngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYQAAABQABoNf1AAAAABJRU5ErkJggg==';
const samplePng = Buffer.from(samplePngBase64, 'base64');

describe('Upload', () => {
  let token: string;

  beforeAll(async () => {
    const adminRes = await request(app).post('/auth/login').send({ username: process.env.ADMIN_USER || 'admin', password: process.env.ADMIN_PASSWORD || 'changeme' });
    token = adminRes.body.token;
  });

  afterAll(() => {
    // cleanup storage and db
    db.deleteAllImages();
    const storageDir = path.join(process.cwd(), 'storage');
    if (fs.existsSync(storageDir)) fs.rmSync(storageDir, { recursive: true, force: true });
    // remove JSON db file if used
    const jsonDb = path.join(process.cwd(), 'data.json');
    if (fs.existsSync(jsonDb)) fs.rmSync(jsonDb, { force: true });
  });

  it('uploads a valid image', async () => {
    const res = await request(app)
      .post('/upload')
      .set('Authorization', `Bearer ${token}`)
      .field('projectSlug', 'project-a')
      .attach('file', samplePng, 'sample.png');

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    const row: any = db.getImageById(res.body.id);
    expect(row).toBeTruthy();
    expect(row.project_id || row.projectId).toBe('project-a');
  });

  it('rejects invalid project', async () => {
    const res = await request(app)
      .post('/upload')
      .set('Authorization', `Bearer ${token}`)
      .field('projectId', 'invalid')
      .attach('file', samplePng, 'sample.png');

    expect(res.status).toBe(400);
  });

  it('rejects non-image file', async () => {
    const res = await request(app)
      .post('/upload')
      .set('Authorization', `Bearer ${token}`)
      .field('projectId', 'project-a')
      .attach('file', Buffer.from('hello world'), 'text.txt');

    expect(res.status).toBe(400);
  });

  it('rejects too large file', async () => {
    // create large buffer > 200KB
    const big = Buffer.alloc(300 * 1024, 0);
    const res = await request(app)
      .post('/upload')
      .set('Authorization', `Bearer ${token}`)
      .field('projectId', 'project-a')
      .attach('file', big, 'big.png');

    // multer should reject with 413
    expect([400, 413]).toContain(res.status);
  });
});
