import { NextFunction, Request, Response } from 'express';

function detectImage(buffer: Buffer): { ext: string; mime: string } | null {
  if (buffer.length >= 8 && buffer.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return { ext: 'png', mime: 'image/png' };
  }
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { ext: 'jpg', mime: 'image/jpeg' };
  }
  if (buffer.length >= 6 && (buffer.slice(0, 6).toString() === 'GIF89a' || buffer.slice(0, 6).toString() === 'GIF87a')) {
    return { ext: 'gif', mime: 'image/gif' };
  }
  if (buffer.length >= 12 && buffer.slice(0, 4).toString() === 'RIFF' && buffer.slice(8, 12).toString() === 'WEBP') {
    return { ext: 'webp', mime: 'image/webp' };
  }
  return null;
}

export default async function fileTypeValidator(req: Request, res: Response, next: NextFunction) {
  const file = (req as any).file;
  if (!file) return res.status(400).json({ error: 'file is required' });

  const buffer: Buffer = file.buffer;
  const detected = detectImage(buffer);
  if (!detected) return res.status(400).json({ error: 'unsupported file type' });

  (req as any).detectedFileType = detected;
  next();
}
