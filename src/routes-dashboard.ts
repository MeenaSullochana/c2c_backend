import { Router } from 'express';
import { PERMISSIONS } from './shared';
import { asyncHandler, requireAuth, requirePermission } from './middleware';
import { BranchModel, EmployeeModel, LeadModel, LeaveRequestModel } from './models-business';
import { tenantObjectId } from './scope';

export const dashboardRouter = Router();
dashboardRouter.use(requireAuth);

dashboardRouter.get(
  '/summary',
  requirePermission(PERMISSIONS.TENANT_VIEW),
  asyncHandler(async (req, res) => {
    const tenantId = tenantObjectId(req);
    const [employees, leads, pendingLeaves, branches, dueReminders] = await Promise.all([
      EmployeeModel.countDocuments({ tenantId, status: 'ACTIVE' }),
      LeadModel.countDocuments({ tenantId }),
      LeaveRequestModel.countDocuments({ tenantId, status: 'PENDING' }),
      BranchModel.countDocuments({ tenantId, status: 'ACTIVE' }),
      LeadModel.countDocuments({
        tenantId,
        status: { $nin: ['WON', 'LOST'] },
        reminderDone: { $ne: true },
        $or: [
          { reminderAt: { $lte: new Date(Date.now() + 48 * 60 * 60 * 1000) } },
          { nextFollowUpAt: { $lte: new Date(Date.now() + 48 * 60 * 60 * 1000) } },
        ],
      }),
    ]);
    res.json({ employees, leads, pendingLeaves, branches, dueReminders });
  }),
);
