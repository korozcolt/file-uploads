import fs from 'fs';
import path from 'path';

// Minimal DB abstraction: try to use better-sqlite3 if available, otherwise fallback to a JSON file.
let useSqlite = false as boolean;
let sqlite: any = null;
let db: any = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  sqlite = require('better-sqlite3');
  const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'data.sqlite');
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  db = new sqlite(DB_PATH);
  db.prepare(
    `CREATE TABLE IF NOT EXISTS images (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      mime TEXT NOT NULL,
      size INTEGER NOT NULL,
      path TEXT NOT NULL,
      created_at TEXT NOT NULL
    )`
  ).run();

  db.prepare(
    `CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL
    )`
  ).run();

  db.prepare(
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin',
      created_at TEXT NOT NULL
    )`
  ).run();

  // Users helper methods
  db.insertUser = function (u: any) {
    const stmt = db.prepare('INSERT INTO users (id, username, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)');
    stmt.run(u.id, u.username, u.password_hash, u.role || 'admin', u.created_at);
    return u;
  };

  db.getUserByUsername = function (username: string) {
    return db.prepare('SELECT * FROM users WHERE lower(username) = lower(?)').get(username);
  };

  db.getUserById = function (id: string) {
    return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  };

  db.deleteAllUsers = function () {
    return db.prepare('DELETE FROM users').run();
  };

  // Projects helper methods
  db.prepare(
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_slug ON projects (lower(slug))`
  ).run();

  db.insertProject = function (p: any) {
    const stmt = db.prepare('INSERT INTO projects (id, name, slug, description, status, created_at) VALUES (?, ?, ?, ?, ?, ?)');
    stmt.run(p.id, p.name, p.slug, p.description || null, p.status || 'active', p.created_at);
    return p;
  };

  db.getProjectBySlug = function (slug: string) {
    return db.prepare('SELECT * FROM projects WHERE lower(slug) = lower(?)').get(slug);
  };

  db.getProjectById = function (id: string) {
    return db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
  };

  db.listProjects = function () {
    return db.prepare('SELECT * FROM projects ORDER BY created_at DESC').all();
  };

  db.deleteProject = function (id: string) {
    return db.prepare("UPDATE projects SET status='deleted' WHERE id = ?").run(id);
  };

  useSqlite = true;
} catch (err) {
  // fallback to JSON file (robust against non-existent mount paths)
  let FILE = process.env.DB_PATH || path.join(process.cwd(), 'data.json');
  try {
    const dir = path.dirname(FILE);
    if (dir && !fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, JSON.stringify({ images: [], projects: [], users: [] }, null, 2));
  } catch (e) {
    // if writing to the configured DB_PATH fails (e.g., no mount or permissions), fall back to local data.json
    FILE = path.join(process.cwd(), 'data.json');
    if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, JSON.stringify({ images: [], projects: [], users: [] }, null, 2));
  }

  db = {
    file: FILE,
    read() {
      return JSON.parse(fs.readFileSync(this.file, 'utf-8'));
    },
    write(data: any) {
      fs.writeFileSync(this.file, JSON.stringify(data, null, 2));
    }
  };
}

export function insertImage(record: any) {
  if (useSqlite) {
    const stmt = db.prepare(`INSERT INTO images (id, project_id, filename, original_name, mime, size, path, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
    stmt.run(record.id, record.projectId, record.filename, record.originalName, record.mime, record.size, record.path, record.createdAt);
    return record;
  }

  const data = db.read();
  data.images.push({
    id: record.id,
    project_id: record.projectId,
    filename: record.filename,
    original_name: record.originalName,
    mime: record.mime,
    size: record.size,
    path: record.path,
    created_at: record.createdAt
  });
  db.write(data);
  return record;
}

export function getImageById(id: string) {
  if (useSqlite) {
    return db.prepare('SELECT * FROM images WHERE id = ?').get(id);
  }
  const data = db.read();
  return data.images.find((i: any) => i.id === id);
}

export function listImages(opts: { projectId?: string; q?: string; limit?: number; offset?: number }) {
  const { projectId, q, limit = 20, offset = 0 } = opts;
  if (useSqlite) {
    let sql = 'SELECT * FROM images WHERE 1=1';
    const params: any[] = [];
    if (projectId) {
      sql += ' AND project_id = ?';
      params.push(projectId);
    }
    if (q) {
      sql += ' AND (filename LIKE ? OR original_name LIKE ?)';
      params.push(`%${q}%`, `%${q}%`);
    }
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    return db.prepare(sql).all(...params);
  }

  const data = db.read();
  let items = data.images as any[];
  if (projectId) items = items.filter((i) => i.project_id === projectId);
  if (q) items = items.filter((i) => i.filename.includes(q) || i.original_name.includes(q));
  items = items.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  return items.slice(offset, offset + limit);
}

export function deleteAllImages() {
  if (useSqlite) {
    return db.prepare('DELETE FROM images').run();
  }
  const data = db.read();
  data.images = [];
  db.write(data);
  return;
}

// Projects helpers (named exports that work for both sqlite and JSON fallback)
export function insertProjectRecord(p: any) {
  if (useSqlite) {
    return db.insertProject(p);
  }
  const data = db.read();
  data.projects = data.projects || [];
  data.projects.push({ id: p.id, name: p.name, slug: p.slug, description: p.description || null, status: p.status || 'active', created_at: p.created_at });
  db.write(data);
  return p;
}

// Users helpers
export function insertUserRecord(u: any) {
  if (useSqlite) {
    return db.insertUser(u);
  }
  const data = db.read();
  data.users = data.users || [];
  data.users.push({ id: u.id, username: u.username, password_hash: u.password_hash, role: u.role || 'admin', created_at: u.created_at });
  db.write(data);
  return u;
}

export function getUserByUsernameRecord(username: string) {
  if (useSqlite) return db.getUserByUsername(username);
  const all = db.read();
  return (all.users || []).find((usr: any) => String(usr.username).toLowerCase() === String(username).toLowerCase());
}

export function getUserByIdRecord(id: string) {
  if (useSqlite) return db.getUserById(id);
  const all = db.read();
  return (all.users || []).find((usr: any) => usr.id === id);
}

export function deleteAllUsersRecord() {
  if (useSqlite) {
    return db.deleteAllUsers();
  }
  const data = db.read();
  data.users = [];
  db.write(data);
  return;
}


export function getProjectBySlugRecord(slug: string) {
  if (useSqlite) return db.getProjectBySlug(slug);
  const all = db.read();
  const found = (all.projects || []).find((pr: any) => String(pr.slug).toLowerCase() === String(slug).toLowerCase());
  if (found) return found;
  // fallback to config file
  try {
    const CONF = path.join(process.cwd(), 'config', 'projects.json');
    if (fs.existsSync(CONF)) {
      const cfg = JSON.parse(fs.readFileSync(CONF, 'utf-8'));
      const p = (cfg.projects || []).find((pr: any) => String(pr.id).toLowerCase() === String(slug).toLowerCase() || String(pr.slug || pr.id).toLowerCase() === String(slug).toLowerCase());
      if (p) return { id: p.id || p.slug || p.name, name: p.name, slug: p.id || p.slug || p.name, description: p.description || null, status: 'active', created_at: new Date().toISOString() };
    }
  } catch (err) {
    /* ignore */
  }
  return null;
}

export function getProjectByIdRecord(id: string) {
  if (useSqlite) return db.getProjectById(id);
  const all = db.read();
  const found = (all.projects || []).find((pr: any) => pr.id === id);
  if (found) return found;
  // fallback config
  try {
    const CONF = path.join(process.cwd(), 'config', 'projects.json');
    if (fs.existsSync(CONF)) {
      const cfg = JSON.parse(fs.readFileSync(CONF, 'utf-8'));
      const p = (cfg.projects || []).find((pr: any) => pr.id === id);
      if (p) return { id: p.id || p.slug || p.name, name: p.name, slug: p.id || p.slug || p.name, description: p.description || null, status: 'active', created_at: new Date().toISOString() };
    }
  } catch (err) {
    /* ignore */
  }
  return null;
}

export function listProjectsRecord() {
  if (useSqlite) return db.listProjects();
  const all = db.read();
  let items = all.projects || [];
  try {
    const CONF = path.join(process.cwd(), 'config', 'projects.json');
    if (fs.existsSync(CONF)) {
      const cfg = JSON.parse(fs.readFileSync(CONF, 'utf-8'));
      const cfgProjects = (cfg.projects || []).map((p: any) => ({ id: p.id || p.slug || p.name, name: p.name, slug: p.id || p.slug || p.name, description: p.description || null, status: 'active', created_at: new Date().toISOString() }));
      // merge without duplicates
      const map: Record<string, any> = {};
      items.concat(cfgProjects).forEach((p: any) => {
        map[p.id] = p;
      });
      items = Object.values(map);
    }
  } catch (err) {
    /* ignore */
  }
  return items;
}

export function deleteProjectRecord(id: string) {
  if (useSqlite) return db.deleteProject(id);
  const data = db.read();
  data.projects = (data.projects || []).filter((p: any) => p.id !== id);
  db.write(data);
  return;
}

// runtime helpful log
try {
  if (!useSqlite) console.log(`DB fallback: using JSON file at ${db.file}`);
  else console.log('DB backend: sqlite');
} catch (e) {
  /* ignore */
}

export default { insertImage, getImageById, listImages, deleteAllImages, insertProjectRecord, getProjectBySlugRecord, getProjectByIdRecord, listProjectsRecord, deleteProjectRecord, insertUserRecord, getUserByUsernameRecord, getUserByIdRecord, deleteAllUsersRecord };

