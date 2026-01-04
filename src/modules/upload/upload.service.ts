import { ImageRecord } from '../../types/image';
import db from '../../db';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function saveImage(projectId: string, file: { buffer: Buffer; originalname: string; size: number }, detected: { ext: string; mime: string }) {
  const id = uuidv4();
  const filename = `${id}.${detected.ext}`;
  const dateObj = new Date();
  const y = String(dateObj.getUTCFullYear());
  const m = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getUTCDate()).padStart(2, '0');

  const storageBase = process.env.STORAGE_PATH || path.join(process.cwd(), 'storage');
  const storageDir = path.join(storageBase, projectId, y, m, d);
  if (!fs.existsSync(storageDir)) fs.mkdirSync(storageDir, { recursive: true });
  const filepath = path.join(storageDir, filename);
  fs.writeFileSync(filepath, file.buffer);

  const createdAt = new Date().toISOString();
  const record: ImageRecord = {
    id,
    projectId,
    filename,
    originalName: file.originalname,
    mime: detected.mime,
    size: file.size,
    path: filepath,
    createdAt
  };

  // persist record
  try {
    const dbModule = await import('../../db');
    if (typeof dbModule.insertImage === 'function') {
      dbModule.insertImage(record);
    } else if (dbModule.default && typeof dbModule.default.insertImage === 'function') {
      dbModule.default.insertImage(record);
    } else {
      throw new Error('db insertImage not available');
    }
  } catch (err) {
    throw err;
  }

  return record;
}
