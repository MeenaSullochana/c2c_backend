import { Router } from 'express';
import { PERMISSIONS } from './shared';
import { asyncHandler, requireAuth, requirePermission } from './middleware';
import {
  createBranch,
  createCity,
  createCountry,
  createState,
  listBranches,
  listCities,
  listCountries,
  listStates,
  locationTree,
} from './services-locations';

export const locationRouter = Router();
locationRouter.use(requireAuth);

locationRouter.get(
  '/tree',
  requirePermission(PERMISSIONS.LOCATION_VIEW),
  asyncHandler(async (req, res) => {
    res.json(await locationTree(req));
  }),
);
locationRouter.get(
  '/countries',
  requirePermission(PERMISSIONS.LOCATION_VIEW),
  asyncHandler(async (req, res) => {
    res.json(await listCountries(req));
  }),
);
locationRouter.post(
  '/countries',
  requirePermission(PERMISSIONS.LOCATION_MANAGE),
  asyncHandler(async (req, res) => {
    res.status(201).json(await createCountry(req));
  }),
);
locationRouter.get(
  '/states',
  requirePermission(PERMISSIONS.LOCATION_VIEW),
  asyncHandler(async (req, res) => {
    res.json(await listStates(req));
  }),
);
locationRouter.post(
  '/states',
  requirePermission(PERMISSIONS.LOCATION_MANAGE),
  asyncHandler(async (req, res) => {
    res.status(201).json(await createState(req));
  }),
);
locationRouter.get(
  '/cities',
  requirePermission(PERMISSIONS.LOCATION_VIEW),
  asyncHandler(async (req, res) => {
    res.json(await listCities(req));
  }),
);
locationRouter.post(
  '/cities',
  requirePermission(PERMISSIONS.LOCATION_MANAGE),
  asyncHandler(async (req, res) => {
    res.status(201).json(await createCity(req));
  }),
);

export const branchRouter = Router();
branchRouter.use(requireAuth);
branchRouter.get(
  '/',
  requirePermission(PERMISSIONS.BRANCH_VIEW),
  asyncHandler(async (req, res) => {
    res.json(await listBranches(req));
  }),
);
branchRouter.post(
  '/',
  requirePermission(PERMISSIONS.BRANCH_MANAGE),
  asyncHandler(async (req, res) => {
    res.status(201).json(await createBranch(req));
  }),
);
