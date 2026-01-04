import app from '../src/app';
import db from '../src/db';
import fs from 'fs';
import path from 'path';
import request from 'supertest';

const samplePngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYQAAABQABoNf1AAAAABJRU5ErkJggg==';
const samplePng = Buffer.from(samplePngBase64, 'base64');

describe('Images list & search', () => {
  beforeAll(async () => {
    // need admin token to upload
    const adminRes = await request(app).post('/auth/login').send({ username: process.env.ADMIN_USER || 'admin', password: process.env.ADMIN_PASSWORD || 'changeme' });
    const token = adminRes.body.token;

    // create 3 images in project-a and 1 in project-b
    for (let i = 0; i < 3; i++) {
      await request(app).post('/upload').set('Authorization', `Bearer ${token}`).field('projectId', 'project-a').attach('file', samplePng, `sample${i}.png`);
    }
    await request(app).post('/upload').set('Authorization', `Bearer ${token}`).field('projectId', 'project-b').attach('file', samplePng, `other.png`);
  });

  afterAll(() => {
    db.deleteAllImages();
    const storageDir = path.join(process.cwd(), 'storage');
    if (fs.existsSync(storageDir)) fs.rmSync(storageDir, { recursive: true, force: true });
    const jsonDb = path.join(process.cwd(), 'data.json');
    if (fs.existsSync(jsonDb)) fs.rmSync(jsonDb, { force: true });
  });

  it('lists by project with pagination', async () => {
    const res = await request(app).get('/images').query({ projectId: 'project-a', limit: 2, offset: 0 });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('items');
    expect(res.body.items.length).toBe(2);
  });

  it('searches by original name', async () => {
    const res = await request(app).get('/images').query({ q: 'other' });
    expect(res.status).toBe(200);
    expect(res.body.items.length).toBe(1);
    expect(res.body.items[0].original_name || res.body.items[0].originalName).toMatch(/other/);
  });
});
