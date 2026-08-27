import { Router } from 'express';
import { PERMISSIONS } from './shared';
import { asyncHandler, requireAuth, requirePermission } from './middleware';
import {
  clockAttendance,
  createDepartment,
  createDesignation,
  createEmployee,
  createLeave,
  createLeaveType,
  deactivateEmployee,
  decideLeave,
  listAttendance,
  listDepartments,
  listDesignations,
  listEmployees,
  listLeaves,
  listLeaveTypes,
  updateEmployee,
} from './services-hrm';
import { createRole, listRoles, updateRole } from './services-roles';

export const hrmRouter = Router();
hrmRouter.use(requireAuth);

hrmRouter.get(
  '/departments',
  requirePermission(PERMISSIONS.HRM_EMPLOYEE_VIEW),
  asyncHandler(async (req, res) => {
    res.json(await listDepartments(req));
  }),
);
hrmRouter.post(
  '/departments',
  requirePermission(PERMISSIONS.HRM_EMPLOYEE_CREATE),
  asyncHandler(async (req, res) => {
    res.status(201).json(await createDepartment(req));
  }),
);
hrmRouter.get(
  '/designations',
  requirePermission(PERMISSIONS.HRM_EMPLOYEE_VIEW),
  asyncHandler(async (req, res) => {
    res.json(await listDesignations(req));
  }),
);
hrmRouter.post(
  '/designations',
  requirePermission(PERMISSIONS.HRM_EMPLOYEE_CREATE),
  asyncHandler(async (req, res) => {
    res.status(201).json(await createDesignation(req));
  }),
);
hrmRouter.get(
  '/roles',
  requirePermission(PERMISSIONS.ROLE_VIEW),
  asyncHandler(async (req, res) => {
    res.json(await listRoles(req));
  }),
);
hrmRouter.post(
  '/roles',
  requirePermission(PERMISSIONS.ROLE_MANAGE),
  asyncHandler(async (req, res) => {
    res.status(201).json(await createRole(req));
  }),
);
hrmRouter.patch(
  '/roles/:id',
  requirePermission(PERMISSIONS.ROLE_MANAGE),
  asyncHandler(async (req, res) => {
    res.json(await updateRole(req));
  }),
);
hrmRouter.get(
  '/employees',
  requirePermission(PERMISSIONS.HRM_EMPLOYEE_VIEW),
  asyncHandler(async (req, res) => {
    res.json(await listEmployees(req));
  }),
);
hrmRouter.post(
  '/employees',
  requirePermission(PERMISSIONS.HRM_EMPLOYEE_CREATE),
  asyncHandler(async (req, res) => {
    res.status(201).json(await createEmployee(req));
  }),
);
hrmRouter.patch(
  '/employees/:id',
  requirePermission(PERMISSIONS.HRM_EMPLOYEE_UPDATE),
  asyncHandler(async (req, res) => {
    res.json(await updateEmployee(req));
  }),
);
hrmRouter.post(
  '/employees/:id/deactivate',
  requirePermission(PERMISSIONS.HRM_EMPLOYEE_DEACTIVATE),
  asyncHandler(async (req, res) => {
    res.json(await deactivateEmployee(req));
  }),
);
hrmRouter.get(
  '/leave-types',
  requirePermission(PERMISSIONS.HRM_LEAVE_VIEW),
  asyncHandler(async (req, res) => {
    res.json(await listLeaveTypes(req));
  }),
);
hrmRouter.post(
  '/leave-types',
  requirePermission(PERMISSIONS.HRM_LEAVE_MANAGE),
  asyncHandler(async (req, res) => {
    res.status(201).json(await createLeaveType(req));
  }),
);
hrmRouter.get(
  '/leaves',
  requirePermission(PERMISSIONS.HRM_LEAVE_VIEW),
  asyncHandler(async (req, res) => {
    res.json(await listLeaves(req));
  }),
);
hrmRouter.post(
  '/leaves',
  requirePermission(PERMISSIONS.HRM_LEAVE_VIEW),
  asyncHandler(async (req, res) => {
    res.status(201).json(await createLeave(req));
  }),
);
hrmRouter.post(
  '/leaves/:id/approve',
  requirePermission(PERMISSIONS.HRM_LEAVE_MANAGE),
  asyncHandler(async (req, res) => {
    res.json(await decideLeave(req, 'APPROVED'));
  }),
);
hrmRouter.post(
  '/leaves/:id/reject',
  requirePermission(PERMISSIONS.HRM_LEAVE_MANAGE),
  asyncHandler(async (req, res) => {
    res.json(await decideLeave(req, 'REJECTED'));
  }),
);
hrmRouter.get(
  '/attendance',
  requirePermission(PERMISSIONS.HRM_ATTENDANCE_VIEW),
  asyncHandler(async (req, res) => {
    res.json(await listAttendance(req));
  }),
);
hrmRouter.post(
  '/attendance/clock-in',
  requirePermission(PERMISSIONS.HRM_ATTENDANCE_MANAGE),
  asyncHandler(async (req, res) => {
    res.status(201).json(await clockAttendance(req, 'in'));
  }),
);
hrmRouter.post(
  '/attendance/clock-out',
  requirePermission(PERMISSIONS.HRM_ATTENDANCE_MANAGE),
  asyncHandler(async (req, res) => {
    res.json(await clockAttendance(req, 'out'));
  }),
);
