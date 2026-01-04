import { Request, Response } from 'express';

import { saveImage } from './upload.service';

export async function uploadHandler(req: Request, res: Response) {
  try {
    // prefer resolved project from projectValidator middleware
    const resolved = (req as any).project;
    const projectIdFromBody = (req.body && req.body.projectId) || req.headers['x-project-id'];
    const projectId = resolved ? (resolved.slug || resolved.id) : projectIdFromBody;
    const file = (req as any).file;
    const detected = (req as any).detectedFileType;

    if (!projectId) return res.status(400).json({ error: 'missing project' });
    if (!file) return res.status(400).json({ error: 'file is required' });
    if (!detected) return res.status(400).json({ error: 'unsupported file type' });

    const record = await saveImage(projectId, file, detected);
    return res.status(201).json({ id: record.id, projectId: record.projectId, filename: record.filename });
  } catch (err) {
    console.error('uploadHandler error:', err && (((err as any).stack) || err));
    return res.status(500).json({ error: 'internal error' });
  }
}
