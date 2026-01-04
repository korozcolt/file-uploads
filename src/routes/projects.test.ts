import app from '../src/app';
import request from 'supertest';

const adminUser = process.env.ADMIN_USER || 'admin';
const adminPass = process.env.ADMIN_PASSWORD || 'changeme';

let token: string;

describe('Projects API', () => {
  it('logs in admin', async () => {
    const res = await request(app).post('/auth/login').send({ username: adminUser, password: adminPass });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    token = res.body.token;
  });

  it('creates a project', async () => {
    const res = await request(app)
      .post('/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test Project', slug: 'test-project' });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.slug).toBe('test-project');
  });

  it('lists projects', async () => {
    const res = await request(app).get('/projects');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('gets project by slug', async () => {
    const res = await request(app).get('/projects/test-project');
    expect(res.status).toBe(200);
    expect(res.body.slug).toBe('test-project');
  });
});
