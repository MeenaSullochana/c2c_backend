import fs from 'node:fs';
import path from 'node:path';
import type { Request } from 'express';
import { z } from 'zod';
import { ApiException } from './http-error';

export const UPLOADS_ROOT = path.resolve(process.cwd(), 'uploads');

const ALLOWED_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/svg+xml': '.svg',
};

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

ensureDir(UPLOADS_ROOT);

export function publicUploadUrl(req: Request, filename: string): string {
  const tenantId = req.authUser?.tenantId || 'public';
  return `/uploads/${tenantId}/${filename}`;
}

export async function saveImageDataUrl(req: Request, body: unknown) {
  const parsed = z
    .object({
      dataUrl: z.string().min(30).max(3_500_000),
      fileName: z.string().trim().max(120).optional(),
    })
    .safeParse(body);
  if (!parsed.success) {
    throw new ApiException(400, 'upload.invalid_payload');
  }

  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(parsed.data.dataUrl);
  if (!match) {
    throw new ApiException(400, 'upload.invalid_image_type');
  }
  const mime = match[1];
  const ext = ALLOWED_EXT[mime];
  if (!ext) {
    throw new ApiException(400, 'upload.invalid_image_type');
  }

  const buffer = Buffer.from(match[2], 'base64');
  if (buffer.length > 2 * 1024 * 1024) {
    throw new ApiException(400, 'upload.file_too_large');
  }

  const tenantId = req.authUser?.tenantId || 'public';
  const dir = path.join(UPLOADS_ROOT, tenantId);
  ensureDir(dir);
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
  fs.writeFileSync(path.join(dir, filename), buffer);

  return {
    url: publicUploadUrl(req, filename),
    fileName: filename,
    size: buffer.length,
    mimeType: mime,
  };
}
