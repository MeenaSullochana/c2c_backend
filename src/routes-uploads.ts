import { Router } from 'express';
import { asyncHandler, requireAuth } from './middleware';
import { saveImageDataUrl } from './upload';

export const uploadsRouter = Router();

uploadsRouter.post(
  '/image',
  requireAuth,
  asyncHandler(async (req, res) => {
    res.status(201).json(await saveImageDataUrl(req, req.body));
  }),
);
