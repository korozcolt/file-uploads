import app from '../src/app';
import db from '../src/db';
import fs from 'fs';
import path from 'path';
import request from 'supertest';

const samplePngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYQAAABQABoNf1AAAAABJRU5ErkJggg==';
const samplePng = Buffer.from(samplePngBase64, 'base64');

describe('Images signed URLs', () => {
  let imageId: string;

  beforeAll(async () => {
    const adminRes = await request(app).post('/auth/login').send({ username: process.env.ADMIN_USER || 'admin', password: process.env.ADMIN_PASSWORD || 'changeme' });
    const token = adminRes.body.token;

    const res = await request(app)
      .post('/upload')
      .set('Authorization', `Bearer ${token}`)
      .field('projectSlug', 'project-a')
      .attach('file', samplePng, 'sample.png');

    imageId = res.body.id;
  });

  afterAll(() => {
    db.deleteAllImages();
    const storageDir = path.join(process.cwd(), 'storage');
    if (fs.existsSync(storageDir)) fs.rmSync(storageDir, { recursive: true, force: true });
    const jsonDb = path.join(process.cwd(), 'data.json');
    if (fs.existsSync(jsonDb)) fs.rmSync(jsonDb, { force: true });
  });

  it('generates token and allows access', async () => {
    const signRes = await request(app).post(`/images/${imageId}/sign`).send();
    expect(signRes.status).toBe(200);
    expect(signRes.body).toHaveProperty('token');
    expect(signRes.body).toHaveProperty('url');

    const token = signRes.body.token;
    const getRes = await request(app).get(`/images/${imageId}`).query({ token });
    expect(getRes.status).toBe(200);
    expect(getRes.header['content-type']).toMatch(/image\//);
    expect(getRes.body.length).toBeGreaterThan(0);
  });

  it('rejects access without token', async () => {
    const res = await request(app).get(`/images/${imageId}`);
    expect(res.status).toBe(401);
  });

  it('rejects invalid token', async () => {
    const res = await request(app).get(`/images/${imageId}`).query({ token: 'nope' });
    expect(res.status).toBe(401);
  });
});
