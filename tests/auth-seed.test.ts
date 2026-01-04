import app from '../src/app';
import bcrypt from 'bcryptjs';
import db from '../src/db';
import request from 'supertest';
import { v4 as uuidv4 } from 'uuid';

describe('Auth with DB seed', () => {
  const username = 'ing.korozco@gmail.com';
  const password = process.env.TEST_ADMIN_PASSWORD || require('crypto').randomBytes(12).toString('hex');
  let id: string;

  beforeAll(() => {
    const password_hash = bcrypt.hashSync(password, 10);
    id = uuidv4();
    // insert via DB helper
    if ((db as any).insertUserRecord) {
      (db as any).insertUserRecord({ id, username, password_hash, role: 'admin', created_at: new Date().toISOString() });
    } else if ((db as any).default && (db as any).default.insertUserRecord) {
      (db as any).default.insertUserRecord({ id, username, password_hash, role: 'admin', created_at: new Date().toISOString() });
    }

    // sanity check: ensure user is persisted
    const stored = (db as any).getUserByUsername ? (db as any).getUserByUsername(username) : ((db as any).getUserByUsernameRecord ? (db as any).getUserByUsernameRecord(username) : null);
    // If getUser not available, try reading data.json
    if (!stored) {
      const fs = require('fs');
      const path = require('path');
      const file = process.env.DB_PATH || path.join(process.cwd(), 'data.json');
      if (fs.existsSync(file)) {
        const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
        const found = (data.users || []).find((u: any) => u.username === username);
        if (found) return;
      }
      console.error('User not found after insert in beforeAll');
    }
  });

  afterAll(() => {
    // cleanup users and other data
    if ((db as any).deleteAllUsers) (db as any).deleteAllUsers();
    if ((db as any).deleteAllUsersRecord) (db as any).deleteAllUsersRecord();
  });

  it('allows login with seeded user', async () => {
    const res = await request(app).post('/auth/login').send({ username, password });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  it('rejects wrong password', async () => {
    const res = await request(app).post('/auth/login').send({ username, password: 'wrong' });
    expect(res.status).toBe(401);
  });
});