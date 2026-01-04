import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { getUserByUsername } from '../db/users';
import jwt from 'jsonwebtoken';

const router = Router();
const SECRET = process.env.JWT_SECRET || 'changeme_should_be_changed';
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'changeme';

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });

  // First try DB stored users (hashed passwords)
  try {
    const user: any = await getUserByUsername(username);
    if (user) {
      const ok = bcrypt.compareSync(password, user.password_hash || user.passwordHash || user.password);
      if (!ok) return res.status(401).json({ error: 'invalid credentials' });
      const token = jwt.sign({ role: user.role || 'admin', user: user.username }, SECRET, { expiresIn: '7d' });
      return res.json({ token });
    }
  } catch (err) {
    // fallthrough to env check
  }

  // fallback to env variables for simple setups
  if (username !== ADMIN_USER || password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'invalid credentials' });
  const token = jwt.sign({ role: 'admin', user: username }, SECRET, { expiresIn: '7d' });
  return res.json({ token });
});

export default router;
