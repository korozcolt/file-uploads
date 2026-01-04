import { getImageById } from '../../db';
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'changeme_should_be_changed';
const DEFAULT_HOURS = Number(process.env.URL_EXPIRATION_HOURS || 24);

export function generateTokenForImage(id: string, hours?: number) {
  const exp = Math.floor(Date.now() / 1000) + (hours ?? DEFAULT_HOURS) * 60 * 60;
  return jwt.sign({ id, exp }, SECRET);
}

export function verifyToken(token: string) {
  try {
    const payload = jwt.verify(token, SECRET) as { id: string; exp: number };
    return payload;
  } catch (err) {
    return null;
  }
}

export function getImage(id: string) {
  return getImageById(id);
}
