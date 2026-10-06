import { Router } from 'express';
import { PERMISSIONS } from './shared';
import { asyncHandler, requireAuth, requirePermission } from './middleware';
import { BranchModel, EmployeeModel, LeadModel, LeaveRequestModel } from './models-business';
import { applyLeadAccessFilter, resolveLeadAccess, tenantObjectId } from './scope';
import { getC2cDashboard } from './services-c2c-dashboard';

export const dashboardRouter = Router();
dashboardRouter.use(requireAuth);

dashboardRouter.get(
  '/summary',
  requirePermission(PERMISSIONS.TENANT_VIEW),
  asyncHandler(async (req, res) => {
    const tenantId = tenantObjectId(req);
    const access = await resolveLeadAccess(req);
    const leadFilter = applyLeadAccessFilter({ tenantId }, access);
    const [employees, leads, pendingLeaves, branches, dueReminders] = await Promise.all([
      EmployeeModel.countDocuments({ tenantId, status: 'ACTIVE' }),
      LeadModel.countDocuments(leadFilter),
      LeaveRequestModel.countDocuments({ tenantId, status: 'PENDING' }),
      BranchModel.countDocuments({ tenantId, status: 'ACTIVE' }),
      LeadModel.countDocuments(
        applyLeadAccessFilter(
          {
            tenantId,
            status: { $nin: ['DISBURSED', 'WON', 'LOST'] },
            reminderDone: { $ne: true },
            $or: [
              { reminderAt: { $lte: new Date(Date.now() + 48 * 60 * 60 * 1000) } },
              { nextFollowUpAt: { $lte: new Date(Date.now() + 48 * 60 * 60 * 1000) } },
            ],
          },
          access,
        ),
      ),
    ]);
    res.json({ employees, leads, pendingLeaves, branches, dueReminders, accessScope: access.scope });
  }),
);

dashboardRouter.get(
  '/c2c',
  requirePermission(PERMISSIONS.LEAD_VIEW),
  asyncHandler(async (req, res) => {
    res.json(await getC2cDashboard(req));
  }),
);
