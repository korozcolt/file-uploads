import app from '../src/app';
import request from 'supertest';

describe('Docs', () => {
  it('serves swagger ui at /docs', async () => {
    const res = await request(app).get('/docs/');
    expect(res.status).toBe(200);
  });

  it('serves raw spec at /docs.json', async () => {
    const res = await request(app).get('/docs.json');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('openapi');
    expect(res.body.openapi).toMatch(/^3\./);
    expect(res.body.components).toBeDefined();
    expect(res.body.components.schemas).toBeDefined();
    expect(res.body.components.schemas.Project).toBeDefined();
    expect(res.body.components.schemas.ImageResponse).toBeDefined();
  });
});
