import { NextFunction, Request, Response } from 'express';

import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'changeme_should_be_changed';

export default function adminAuth(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'missing token' });
  const token = auth.split(' ')[1];
  try {
    const payload = jwt.verify(token, SECRET) as any;
    if (!payload || payload.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
    (req as any).admin = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'invalid token' });
  }
}
