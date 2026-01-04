import * as projects from '../db/projects';

import { Router } from 'express';
import adminAuth from '../middleware/adminAuth';

const router = Router();

router.post('/', adminAuth, (req, res) => {
  const { name, slug, description } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  try {
    const p = projects.createProject({ name, slug, description });
    return res.status(201).json(p);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

router.get('/', (_req, res) => {
  const list = projects.listProjects();
  res.json(list);
});

router.get('/:slug', (req, res) => {
  const slug = req.params.slug;
  const p = projects.getProjectBySlug(slug);
  if (!p) return res.status(404).json({ error: 'not found' });
  return res.json(p);
});

router.delete('/:id', adminAuth, (req, res) => {
  const id = req.params.id;
  projects.deleteProject(id);
  return res.status(204).end();
});

export default router;
