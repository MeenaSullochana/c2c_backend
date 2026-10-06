import { Router } from 'express';
import { PERMISSIONS } from './shared';
import { asyncHandler, requireAuth, requirePermission } from './middleware';
import {
  createAnnouncement,
  createBank,
  createEnquiry,
  deleteBank,
  listAnnouncements,
  listBanks,
  listBirthdaysToday,
  listEnquiries,
  listPublicBanks,
  updateBank,
} from './services-website';

export const websiteRouter = Router();

websiteRouter.get(
  '/banks/public',
  asyncHandler(async (req, res) => {
    res.json(await listPublicBanks(req));
  }),
);
websiteRouter.post(
  '/enquiries/public',
  asyncHandler(async (req, res) => {
    res.status(201).json(await createEnquiry(req));
  }),
);

websiteRouter.use(requireAuth);

websiteRouter.get(
  '/banks',
  requirePermission(PERMISSIONS.TENANT_VIEW),
  asyncHandler(async (req, res) => {
    res.json(await listBanks(req));
  }),
);
websiteRouter.post(
  '/banks',
  requirePermission(PERMISSIONS.TENANT_UPDATE),
  asyncHandler(async (req, res) => {
    res.status(201).json(await createBank(req));
  }),
);
websiteRouter.patch(
  '/banks/:id',
  requirePermission(PERMISSIONS.TENANT_UPDATE),
  asyncHandler(async (req, res) => {
    res.json(await updateBank(req));
  }),
);
websiteRouter.delete(
  '/banks/:id',
  requirePermission(PERMISSIONS.TENANT_UPDATE),
  asyncHandler(async (req, res) => {
    res.json(await deleteBank(req));
  }),
);

websiteRouter.get(
  '/enquiries',
  requirePermission(PERMISSIONS.TENANT_VIEW),
  asyncHandler(async (req, res) => {
    res.json(await listEnquiries(req));
  }),
);
websiteRouter.post(
  '/enquiries',
  requirePermission(PERMISSIONS.TENANT_VIEW),
  asyncHandler(async (req, res) => {
    res.status(201).json(await createEnquiry(req));
  }),
);

websiteRouter.get(
  '/announcements',
  requirePermission(PERMISSIONS.TENANT_VIEW),
  asyncHandler(async (req, res) => {
    res.json(await listAnnouncements(req));
  }),
);
websiteRouter.post(
  '/announcements',
  requirePermission(PERMISSIONS.TENANT_UPDATE),
  asyncHandler(async (req, res) => {
    res.status(201).json(await createAnnouncement(req));
  }),
);

websiteRouter.get(
  '/birthdays/today',
  requirePermission(PERMISSIONS.HRM_EMPLOYEE_VIEW),
  asyncHandler(async (req, res) => {
    res.json(await listBirthdaysToday(req));
  }),
);
