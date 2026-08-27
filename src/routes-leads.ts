import { Router } from 'express';
import { PERMISSIONS } from './shared';
import { asyncHandler, requireAuth, requirePermission } from './middleware';
import {
  completeReminder,
  createFollowUp,
  createLead,
  getLead,
  importLeads,
  listFollowUps,
  listLeads,
  listReminders,
  updateLead,
} from './services-leads';

export const leadRouter = Router();
leadRouter.use(requireAuth);

leadRouter.get(
  '/',
  requirePermission(PERMISSIONS.LEAD_VIEW),
  asyncHandler(async (req, res) => {
    res.json(await listLeads(req));
  }),
);
leadRouter.post(
  '/',
  requirePermission(PERMISSIONS.LEAD_CREATE),
  asyncHandler(async (req, res) => {
    res.status(201).json(await createLead(req));
  }),
);
leadRouter.post(
  '/import',
  requirePermission(PERMISSIONS.LEAD_IMPORT),
  asyncHandler(async (req, res) => {
    res.status(201).json(await importLeads(req));
  }),
);
leadRouter.get(
  '/reminders',
  requirePermission(PERMISSIONS.LEAD_VIEW),
  asyncHandler(async (req, res) => {
    res.json(await listReminders(req));
  }),
);
leadRouter.post(
  '/:id/reminders/complete',
  requirePermission(PERMISSIONS.LEAD_UPDATE),
  asyncHandler(async (req, res) => {
    res.json(await completeReminder(req));
  }),
);
leadRouter.get(
  '/:id',
  requirePermission(PERMISSIONS.LEAD_VIEW),
  asyncHandler(async (req, res) => {
    res.json(await getLead(req));
  }),
);
leadRouter.patch(
  '/:id',
  requirePermission(PERMISSIONS.LEAD_UPDATE),
  asyncHandler(async (req, res) => {
    res.json(await updateLead(req));
  }),
);
leadRouter.get(
  '/:id/follow-ups',
  requirePermission(PERMISSIONS.LEAD_VIEW),
  asyncHandler(async (req, res) => {
    res.json(await listFollowUps(req));
  }),
);
leadRouter.post(
  '/:id/follow-ups',
  requirePermission(PERMISSIONS.LEAD_UPDATE),
  asyncHandler(async (req, res) => {
    res.status(201).json(await createFollowUp(req));
  }),
);
