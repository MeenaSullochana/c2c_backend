import type { Request } from 'express';
import mongoose from 'mongoose';
import { ApiException } from './http-error';
import {
  AttendanceModel,
  BranchModel,
  DepartmentModel,
  DesignationModel,
  EmployeeModel,
  LeaveRequestModel,
  LeaveTypeModel,
  PayslipModel,
  WorkHistoryModel,
} from './models-business';
import { buildEmployeeAccessFilter, namedId, parseObjectId, resolveLeadAccess, tenantObjectId } from './scope';

export async function listWorkInfo(req: Request) {
  const { filter } = await buildEmployeeAccessFilter(req);
  filter.status = 'ACTIVE';
  const tenantId = tenantObjectId(req);

  const employees = await EmployeeModel.find(filter).sort({ orgRole: 1, firstName: 1 }).lean().exec();
  const branches = await BranchModel.find({ tenantId }).lean().exec();
  const branchMap = new Map(branches.map((b) => [String(b._id), b]));
  const leaves = await LeaveRequestModel.find({
    tenantId,
    employeeId: { $in: employees.map((e) => e._id) },
  })
    .lean()
    .exec();
  const leaveCount = new Map<string, number>();
  for (const row of leaves) {
    const key = String(row.employeeId);
    leaveCount.set(key, (leaveCount.get(key) ?? 0) + 1);
  }

  return employees.map((emp) => {
    const basic = emp.basicSalary || 0;
    const hra = emp.hra || 0;
    const allowances = emp.allowances || 0;
    const deductions = emp.deductions || 0;
    return {
      id: String(emp._id),
      employeeCode: emp.employeeCode,
      name: `${emp.firstName} ${emp.lastName}`,
      email: emp.email,
      phone: emp.phone,
      orgRole: emp.orgRole,
      branch: namedId(branchMap.get(String(emp.branchId))),
      joiningDate: emp.joiningDate,
      basicSalary: basic,
      hra,
      allowances,
      deductions,
      grossSalary: basic + hra + allowances,
      netSalary: basic + hra + allowances - deductions,
      leaveRequests: leaveCount.get(String(emp._id)) ?? 0,
    };
  });
}

export async function getWorkInfoDetail(req: Request) {
  const { tenantId, filter } = await buildEmployeeAccessFilter(req);
  const employeeId = parseObjectId(req.params.id, 'employeeId');
  const emp = await EmployeeModel.findOne({ ...filter, _id: employeeId }).lean().exec();
  if (!emp) {
    throw new ApiException(404, 'hrm.employee_not_found');
  }

  const [branches, departments, designations, managers, history, payslips, leaves, leaveTypes, attendance] =
    await Promise.all([
      BranchModel.find({ tenantId }).lean().exec(),
      DepartmentModel.find({ tenantId }).lean().exec(),
      DesignationModel.find({ tenantId }).lean().exec(),
      EmployeeModel.find({
        tenantId,
        _id: { $in: [emp.managerId, emp.supervisorId].filter(Boolean) },
      })
        .lean()
        .exec(),
      WorkHistoryModel.find({ tenantId, employeeId: emp._id }).sort({ fromDate: -1 }).lean().exec(),
      PayslipModel.find({ tenantId, employeeId: emp._id }).sort({ periodKey: -1 }).limit(12).lean().exec(),
      LeaveRequestModel.find({ tenantId, employeeId: emp._id }).sort({ startDate: -1 }).limit(20).lean().exec(),
      LeaveTypeModel.find({ tenantId }).lean().exec(),
      AttendanceModel.find({ tenantId, employeeId: emp._id }).sort({ dateKey: -1 }).limit(20).lean().exec(),
    ]);

  const branchMap = new Map(branches.map((b) => [String(b._id), b]));
  const departmentMap = new Map(departments.map((d) => [String(d._id), d]));
  const designationMap = new Map(designations.map((d) => [String(d._id), d]));
  const managerMap = new Map(managers.map((m) => [String(m._id), m]));
  const leaveTypeMap = new Map(leaveTypes.map((t) => [String(t._id), t]));

  const basic = emp.basicSalary || 0;
  const hra = emp.hra || 0;
  const allowances = emp.allowances || 0;
  const deductions = emp.deductions || 0;

  let workHistory = history.map((row) => ({
    id: String(row._id),
    eventType: row.eventType,
    title: row.title,
    detail: row.detail || '',
    fromDate: row.fromDate,
    toDate: row.toDate ?? null,
    orgRole: row.orgRole || '',
    branch: namedId(branchMap.get(String(row.branchId))),
    designation: namedId(designationMap.get(String(row.designationId))),
  }));

  if (workHistory.length === 0) {
    workHistory = [
      {
        id: 'joined',
        eventType: 'JOINED',
        title: 'Joined organization',
        detail: `Started as ${emp.orgRole}`,
        fromDate: emp.joiningDate,
        toDate: null,
        orgRole: emp.orgRole,
        branch: namedId(branchMap.get(String(emp.branchId))),
        designation: namedId(designationMap.get(String(emp.designationId))),
      },
    ];
  }

  const manager = emp.managerId ? managerMap.get(String(emp.managerId)) : undefined;
  const supervisor = emp.supervisorId ? managerMap.get(String(emp.supervisorId)) : undefined;

  return {
    id: String(emp._id),
    employeeCode: emp.employeeCode,
    name: `${emp.firstName} ${emp.lastName}`,
    email: emp.email,
    phone: emp.phone || '',
    gender: emp.gender || '',
    address: emp.address || '',
    orgRole: emp.orgRole,
    status: emp.status,
    joiningDate: emp.joiningDate,
    dateOfBirth: emp.dateOfBirth ?? null,
    branch: namedId(branchMap.get(String(emp.branchId))),
    department: namedId(departmentMap.get(String(emp.departmentId))),
    designation: namedId(designationMap.get(String(emp.designationId))),
    manager: manager ? { id: String(manager._id), name: `${manager.firstName} ${manager.lastName}` } : null,
    supervisor: supervisor
      ? { id: String(supervisor._id), name: `${supervisor.firstName} ${supervisor.lastName}` }
      : null,
    basicSalary: basic,
    hra,
    allowances,
    deductions,
    grossSalary: basic + hra + allowances,
    netSalary: basic + hra + allowances - deductions,
    workHistory,
    payslips: payslips.map((row) => ({
      id: String(row._id),
      periodKey: row.periodKey,
      status: row.status,
      basicSalary: row.basicSalary,
      hra: row.hra,
      allowances: row.allowances,
      deductions: row.deductions,
      netPay: row.netPay,
      paidAt: row.paidAt ?? null,
    })),
    leaves: leaves.map((row) => ({
      id: String(row._id),
      leaveType: leaveTypeMap.get(String(row.leaveTypeId))?.name ?? 'Leave',
      startDate: row.startDate,
      endDate: row.endDate,
      reason: row.reason,
      status: row.status,
    })),
    attendance: attendance.map((row) => ({
      id: String(row._id),
      dateKey: row.dateKey,
      clockInAt: row.clockInAt,
      clockOutAt: row.clockOutAt ?? null,
    })),
  };
}

export async function listPayslips(req: Request) {
  const tenantId = tenantObjectId(req);
  const access = await resolveLeadAccess(req);
  const work = await listWorkInfo(req);
  const employeeIds = work.map((row) => new mongoose.Types.ObjectId(row.id));
  const period = req.query.period ? String(req.query.period) : undefined;
  const filter: Record<string, unknown> = {
    tenantId,
    employeeId: {
      $in: employeeIds.length ? employeeIds : [new mongoose.Types.ObjectId('000000000000000000000000')],
    },
  };
  if (period) filter.periodKey = period;

  const rows = await PayslipModel.find(filter).sort({ periodKey: -1 }).lean().exec();
  const empMap = new Map(work.map((row) => [row.id, row]));

  return rows.map((row) => {
    const emp = empMap.get(String(row.employeeId));
    return {
      id: String(row._id),
      periodKey: row.periodKey,
      status: row.status,
      basicSalary: row.basicSalary,
      hra: row.hra,
      allowances: row.allowances,
      deductions: row.deductions,
      netPay: row.netPay,
      paidAt: row.paidAt ?? null,
      employee: emp
        ? { id: emp.id, name: emp.name, employeeCode: emp.employeeCode, branch: emp.branch, orgRole: emp.orgRole }
        : null,
      accessScope: access.scope,
    };
  });
}

export async function getPayslip(req: Request) {
  const tenantId = tenantObjectId(req);
  const work = await listWorkInfo(req);
  const empMap = new Map(work.map((row) => [row.id, row]));
  const slip = await PayslipModel.findOne({
    _id: parseObjectId(req.params.id, 'payslipId'),
    tenantId,
  })
    .lean()
    .exec();
  if (!slip) {
    throw new ApiException(404, 'hrm.payslip_not_found');
  }
  const emp = empMap.get(String(slip.employeeId));
  if (!emp) {
    throw new ApiException(404, 'hrm.payslip_not_found');
  }
  return {
    id: String(slip._id),
    periodKey: slip.periodKey,
    status: slip.status,
    basicSalary: slip.basicSalary,
    hra: slip.hra,
    allowances: slip.allowances,
    deductions: slip.deductions,
    netPay: slip.netPay,
    paidAt: slip.paidAt ?? null,
    createdAt: (slip as { createdAt?: Date }).createdAt ?? null,
    employee: {
      id: emp.id,
      name: emp.name,
      employeeCode: emp.employeeCode,
      email: emp.email,
      phone: emp.phone,
      orgRole: emp.orgRole,
      branch: emp.branch,
      joiningDate: emp.joiningDate,
    },
  };
}

export async function listPayrollSummary(req: Request) {
  const work = await listWorkInfo(req);
  const payslips = await listPayslips(req);
  const byBranch = new Map<
    string,
    { branch: string; employees: number; monthlySalary: number; payslipCount: number }
  >();

  for (const emp of work) {
    const key = emp.branch?.name || 'Unassigned';
    const row = byBranch.get(key) ?? { branch: key, employees: 0, monthlySalary: 0, payslipCount: 0 };
    row.employees += 1;
    row.monthlySalary += emp.netSalary;
    byBranch.set(key, row);
  }
  for (const slip of payslips) {
    const key = slip.employee?.branch?.name || 'Unassigned';
    const row = byBranch.get(key) ?? { branch: key, employees: 0, monthlySalary: 0, payslipCount: 0 };
    row.payslipCount += 1;
    byBranch.set(key, row);
  }

  return {
    totals: {
      employees: work.length,
      monthlySalary: work.reduce((sum, row) => sum + row.netSalary, 0),
      payslips: payslips.length,
    },
    byBranch: [...byBranch.values()].sort((a, b) => b.monthlySalary - a.monthlySalary),
    employees: work,
  };
}
