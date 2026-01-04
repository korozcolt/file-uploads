#!/usr/bin/env node
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const db = require('../dist/db').default || require('../src/db');

async function run() {
  const user = process.env.ADMIN_USER || process.argv[2];
  const pass = process.env.ADMIN_PASSWORD || process.argv[3];
  if (!user || !pass) {
    console.error('Usage: ADMIN_USER=... ADMIN_PASSWORD=... node scripts/seed-admin.js  OR node scripts/seed-admin.js user password');
    process.exit(1);
  }
  const password_hash = bcrypt.hashSync(pass, 10);
  const id = uuidv4();
  const now = new Date().toISOString();

  // prefer using named helper if available
  try {
    if (typeof db.insertUserRecord === 'function') {
      db.insertUserRecord({ id, username: user, password_hash, role: 'admin', created_at: now });
    } else if (db.default && typeof db.default.insertUserRecord === 'function') {
      db.default.insertUserRecord({ id, username: user, password_hash, role: 'admin', created_at: now });
    } else if (typeof db.insertUser === 'function') {
      db.insertUser({ id, username: user, password_hash, role: 'admin', created_at: now });
    } else {
      // try JSON fallback manipulation
      const file = process.env.DB_PATH || path.join(process.cwd(), 'data.json');
      const fs = require('fs');
      const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
      data.users = data.users || [];
      data.users.push({ id, username: user, password_hash, role: 'admin', created_at: now });
      fs.writeFileSync(file, JSON.stringify(data, null, 2));
    }
    console.log('Admin seeded:', user);
    process.exit(0);
  } catch (err) {
    console.error('Failed to seed:', err);
    process.exit(1);
  }
}

run();
