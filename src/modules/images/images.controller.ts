import { Request, Response } from 'express';
import { generateTokenForImage, getImage, verifyToken } from './images.service';

import { listImages } from '../../db';
import path from 'path';

export async function signImageHandler(req: Request, res: Response) {
  const id = req.params.id;
  const hours = req.body && req.body.hours ? Number(req.body.hours) : undefined;

  const image = getImage(id);
  if (!image) return res.status(404).json({ error: 'image not found' });

  const token = generateTokenForImage(id, hours);
  const host = process.env.PUBLIC_HOST || '';
  const url = host ? `${host.replace(/\/$/, '')}/images/${id}?token=${token}` : `/images/${id}?token=${token}`;
  return res.json({ token, url });
}

export async function getImageHandler(req: Request, res: Response) {
  const id = req.params.id;
  const token = req.query.token as string;
  if (!token) return res.status(401).json({ error: 'token required' });

  const payload = verifyToken(token);
  if (!payload || payload.id !== id) return res.status(401).json({ error: 'invalid token' });

  const image = getImage(id);
  if (!image) return res.status(404).json({ error: 'image not found' });

  return res.sendFile(path.resolve(image.path), { headers: { 'Content-Type': image.mime } }, (err) => {
    if (err) {
      console.error(err);
      res.status(500).end();
    }
  });
}

export async function listImagesHandler(req: Request, res: Response) {
  const projectId = (req.query.projectId as string) || undefined;
  const q = (req.query.q as string) || undefined;
  const limit = Math.min(100, Number(req.query.limit || 20));
  const offset = Number(req.query.offset || 0);

  const items = listImages({ projectId, q, limit, offset });
  return res.json({ items, count: items.length, limit, offset });
}

export async function getImageMetaHandler(req: Request, res: Response) {
  const id = req.params.id;
  const image = getImage(id);
  if (!image) return res.status(404).json({ error: 'image not found' });
  return res.json({ id: image.id || image.id, projectId: image.project_id || image.projectId, filename: image.filename, originalName: image.original_name || image.originalName, mime: image.mime, size: image.size, createdAt: image.created_at || image.createdAt });
}