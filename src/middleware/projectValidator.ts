import { NextFunction, Request, Response } from 'express';
import { getProjectById, getProjectBySlug } from '../db/projects';

export default function projectValidator(req: Request, res: Response, next: NextFunction) {
  // accept projectId (UUID) or x-project-slug header or body.projectSlug
  const projectId = (req.body && req.body.projectId) || req.headers['x-project-id'];
  const projectSlug = (req.body && req.body.projectSlug) || req.headers['x-project-slug'];

  if (!projectId && !projectSlug) return res.status(400).json({ error: 'projectId or projectSlug is required' });

  let project: any = null;
  if (projectId) project = getProjectById(String(projectId));
  if (!project && projectSlug) project = getProjectBySlug(String(projectSlug));
  if (!project) return res.status(400).json({ error: 'invalid project' });

  // attach resolved project id to request
  (req as any).project = project;
  next();
}
