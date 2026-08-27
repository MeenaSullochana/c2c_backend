import { z } from 'zod';
import type { Request } from 'express';
import { ApiException } from './http-error';
import {
  AttendanceModel,
  BranchModel,
  DepartmentModel,
  DesignationModel,
  EmployeeModel,
  HrmRoleModel,
  LeaveRequestModel,
  LeaveTypeModel,
} from './models-business';
import { dateKey, namedId, parseObjectId, tenantObjectId } from './scope';
import mongoose from 'mongoose';

const orgRoleSchema = z.enum(['MANAGER', 'SUPERVISOR', 'STAFF']);

export async function listDepartments(req: Request) {
  const rows = await DepartmentModel.find({ tenantId: tenantObjectId(req) }).sort({ name: 1 }).lean().exec();
  return rows.map((row) => ({ id: String(row._id), name: row.name, code: row.code }));
}

export async function createDepartment(req: Request) {
  const parsed = z
    .object({ name: z.string().trim().min(2).max(80), code: z.string().trim().min(2).max(12) })
    .safeParse(req.body);
  if (!parsed.success) {
    throw new ApiException(400, 'validation.failed');
  }
  try {
    const row = await DepartmentModel.create({
      tenantId: tenantObjectId(req),
      name: parsed.data.name,
      code: parsed.data.code.toUpperCase(),
    });
    return { id: String(row._id), name: row.name, code: row.code };
  } catch (error) {
    if (isDuplicate(error)) {
      throw new ApiException(409, 'hrm.department_exists');
    }
    throw error;
  }
}

export async function listDesignations(req: Request) {
  const rows = await DesignationModel.find({ tenantId: tenantObjectId(req) }).sort({ name: 1 }).lean().exec();
  return rows.map((row) => ({ id: String(row._id), name: row.name, code: row.code }));
}

export async function createDesignation(req: Request) {
  const parsed = z
    .object({ name: z.string().trim().min(2).max(80), code: z.string().trim().min(2).max(12) })
    .safeParse(req.body);
  if (!parsed.success) {
    throw new ApiException(400, 'validation.failed');
  }
  try {
    const row = await DesignationModel.create({
      tenantId: tenantObjectId(req),
      name: parsed.data.name,
      code: parsed.data.code.toUpperCase(),
    });
    return { id: String(row._id), name: row.name, code: row.code };
  } catch (error) {
    if (isDuplicate(error)) {
      throw new ApiException(409, 'hrm.designation_exists');
    }
    throw error;
  }
}

export async function listEmployees(req: Request) {
  const tenantId = tenantObjectId(req);
  const filter: Record<string, unknown> = { tenantId };
  if (req.query.branchId) {
    filter.branchId = parseObjectId(String(req.query.branchId), 'branchId');
  }
  if (req.query.orgRole) {
    filter.orgRole = String(req.query.orgRole);
  }
  if (req.query.status) {
    filter.status = String(req.query.status);
  }
  const employees = await EmployeeModel.find(filter).sort({ orgRole: 1, firstName: 1 }).lean().exec();
  return serializeEmployees(tenantId, employees);
}

export async function createEmployee(req: Request) {
  const parsed = employeeBody.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiException(400, 'validation.failed');
  }
  const tenantId = tenantObjectId(req);
  const data = await resolveEmployeeRefs(tenantId, parsed.data);
  try {
    const employee = await EmployeeModel.create({
      tenantId,
      ...data,
      status: 'ACTIVE',
    });
    const [serialized] = await serializeEmployees(tenantId, [employee.toObject()]);
    return serialized;
  } catch (error) {
    if (isDuplicate(error)) {
      throw new ApiException(409, 'hrm.employee_exists');
    }
    throw error;
  }
}

export async function updateEmployee(req: Request) {
  const parsed = employeeBody.partial().safeParse(req.body);
  if (!parsed.success) {
    throw new ApiException(400, 'validation.failed');
  }
  const tenantId = tenantObjectId(req);
  const employee = await EmployeeModel.findOne({
    _id: parseObjectId(req.params.id, 'employeeId'),
    tenantId,
  }).exec();
  if (!employee) {
    throw new ApiException(404, 'hrm.employee_not_found');
  }
  const next = {
    employeeCode: parsed.data.employeeCode ?? employee.employeeCode,
    firstName: parsed.data.firstName ?? employee.firstName,
    lastName: parsed.data.lastName ?? employee.lastName,
    email: parsed.data.email ?? employee.email,
    phone: parsed.data.phone ?? employee.phone,
    branchId: parsed.data.branchId ? String(parsed.data.branchId) : String(employee.branchId),
    departmentId: parsed.data.departmentId ? String(parsed.data.departmentId) : String(employee.departmentId),
    designationId: parsed.data.designationId ? String(parsed.data.designationId) : String(employee.designationId),
    orgRole: parsed.data.orgRole ?? employee.orgRole,
    managerId: parsed.data.managerId === undefined ? optionalId(employee.managerId) : parsed.data.managerId,
    supervisorId: parsed.data.supervisorId === undefined ? optionalId(employee.supervisorId) : parsed.data.supervisorId,
    joiningDate: parsed.data.joiningDate ?? employee.joiningDate.toISOString().slice(0, 10),
    roleId: parsed.data.roleId ?? optionalId(employee.roleId) ?? undefined,
    dateOfBirth: parsed.data.dateOfBirth ?? (employee.dateOfBirth ? employee.dateOfBirth.toISOString().slice(0, 10) : undefined),
    gender: parsed.data.gender ?? employee.gender,
    address: parsed.data.address ?? employee.address,
  };
  const data = await resolveEmployeeRefs(tenantId, next, String(employee._id));
  Object.assign(employee, data);
  await employee.save();
  const [serialized] = await serializeEmployees(tenantId, [employee.toObject()]);
  return serialized;
}

export async function deactivateEmployee(req: Request) {
  const tenantId = tenantObjectId(req);
  const employee = await EmployeeModel.findOne({
    _id: parseObjectId(req.params.id, 'employeeId'),
    tenantId,
  }).exec();
  if (!employee) {
    throw new ApiException(404, 'hrm.employee_not_found');
  }
  employee.status = 'INACTIVE';
  await employee.save();
  return { id: String(employee._id), status: employee.status };
}

export async function listLeaveTypes(req: Request) {
  const rows = await LeaveTypeModel.find({ tenantId: tenantObjectId(req) }).sort({ name: 1 }).lean().exec();
  return rows.map((row) => ({
    id: String(row._id),
    name: row.name,
    daysAllowed: row.daysAllowed,
  }));
}

export async function createLeaveType(req: Request) {
  const parsed = z
    .object({ name: z.string().trim().min(2).max(80), daysAllowed: z.coerce.number().int().min(1).max(365) })
    .safeParse(req.body);
  if (!parsed.success) {
    throw new ApiException(400, 'validation.failed');
  }
  try {
    const row = await LeaveTypeModel.create({
      tenantId: tenantObjectId(req),
      name: parsed.data.name,
      daysAllowed: parsed.data.daysAllowed,
    });
    return { id: String(row._id), name: row.name, daysAllowed: row.daysAllowed };
  } catch (error) {
    if (isDuplicate(error)) {
      throw new ApiException(409, 'hrm.leave_type_exists');
    }
    throw error;
  }
}

export async function listLeaves(req: Request) {
  const tenantId = tenantObjectId(req);
  const filter: Record<string, unknown> = { tenantId };
  if (req.query.status) {
    filter.status = String(req.query.status);
  }
  if (req.query.employeeId) {
    filter.employeeId = parseObjectId(String(req.query.employeeId), 'employeeId');
  }
  const rows = await LeaveRequestModel.find(filter).sort({ createdAt: -1 }).lean().exec();
  const employees = await EmployeeModel.find({ tenantId }).lean().exec();
  const types = await LeaveTypeModel.find({ tenantId }).lean().exec();
  const employeeMap = new Map(employees.map((row) => [String(row._id), row]));
  const typeMap = new Map(types.map((row) => [String(row._id), row]));
  return rows.map((row) => {
    const employee = employeeMap.get(String(row.employeeId));
    const leaveType = typeMap.get(String(row.leaveTypeId));
    return {
      id: String(row._id),
      status: row.status,
      reason: row.reason,
      startDate: row.startDate,
      endDate: row.endDate,
      decidedAt: row.decidedAt ?? null,
      employee: employee
        ? {
            id: String(employee._id),
            name: `${employee.firstName} ${employee.lastName}`,
            employeeCode: employee.employeeCode,
          }
        : null,
      leaveType: leaveType ? { id: String(leaveType._id), name: leaveType.name } : null,
    };
  });
}

export async function createLeave(req: Request) {
  const parsed = z
    .object({
      employeeId: z.string().min(1),
      leaveTypeId: z.string().min(1),
      startDate: z.string().min(8),
      endDate: z.string().min(8),
      reason: z.string().trim().min(2).max(500),
    })
    .safeParse(req.body);
  if (!parsed.success) {
    throw new ApiException(400, 'validation.failed');
  }
  const tenantId = tenantObjectId(req);
  const employee = await EmployeeModel.findOne({
    _id: parseObjectId(parsed.data.employeeId, 'employeeId'),
    tenantId,
    status: 'ACTIVE',
  }).exec();
  const leaveType = await LeaveTypeModel.findOne({
    _id: parseObjectId(parsed.data.leaveTypeId, 'leaveTypeId'),
    tenantId,
  }).exec();
  if (!employee || !leaveType) {
    throw new ApiException(404, 'hrm.leave_refs_not_found');
  }
  const startDate = new Date(parsed.data.startDate);
  const endDate = new Date(parsed.data.endDate);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || endDate < startDate) {
    throw new ApiException(400, 'hrm.leave_dates_invalid');
  }
  const row = await LeaveRequestModel.create({
    tenantId,
    employeeId: employee._id,
    leaveTypeId: leaveType._id,
    startDate,
    endDate,
    reason: parsed.data.reason,
    status: 'PENDING',
  });
  return { id: String(row._id), status: row.status };
}

export async function decideLeave(req: Request, status: 'APPROVED' | 'REJECTED') {
  const tenantId = tenantObjectId(req);
  const row = await LeaveRequestModel.findOne({
    _id: parseObjectId(req.params.id, 'leaveId'),
    tenantId,
  }).exec();
  if (!row) {
    throw new ApiException(404, 'hrm.leave_not_found');
  }
  if (row.status !== 'PENDING') {
    throw new ApiException(409, 'hrm.leave_already_decided');
  }
  row.status = status;
  row.decidedBy = new mongoose.Types.ObjectId(req.authUser!.id);
  row.decidedAt = new Date();
  await row.save();
  return { id: String(row._id), status: row.status };
}

export async function listAttendance(req: Request) {
  const tenantId = tenantObjectId(req);
  const filter: Record<string, unknown> = { tenantId };
  if (req.query.employeeId) {
    filter.employeeId = parseObjectId(String(req.query.employeeId), 'employeeId');
  }
  const rows = await AttendanceModel.find(filter).sort({ clockInAt: -1 }).limit(200).lean().exec();
  const employees = await EmployeeModel.find({ tenantId }).lean().exec();
  const employeeMap = new Map(employees.map((row) => [String(row._id), row]));
  return rows.map((row) => {
    const employee = employeeMap.get(String(row.employeeId));
    return {
      id: String(row._id),
      dateKey: row.dateKey,
      clockInAt: row.clockInAt,
      clockOutAt: row.clockOutAt ?? null,
      employee: employee
        ? {
            id: String(employee._id),
            name: `${employee.firstName} ${employee.lastName}`,
            employeeCode: employee.employeeCode,
          }
        : null,
    };
  });
}

export async function clockAttendance(req: Request, action: 'in' | 'out') {
  const parsed = z.object({ employeeId: z.string().min(1) }).safeParse(req.body);
  if (!parsed.success) {
    throw new ApiException(400, 'validation.failed');
  }
  const tenantId = tenantObjectId(req);
  const employee = await EmployeeModel.findOne({
    _id: parseObjectId(parsed.data.employeeId, 'employeeId'),
    tenantId,
    status: 'ACTIVE',
  }).exec();
  if (!employee) {
    throw new ApiException(404, 'hrm.employee_not_found');
  }
  const today = dateKey();
  if (action === 'in') {
    try {
      const row = await AttendanceModel.create({
        tenantId,
        employeeId: employee._id,
        dateKey: today,
        clockInAt: new Date(),
      });
      return { id: String(row._id), dateKey: row.dateKey, clockInAt: row.clockInAt, clockOutAt: null };
    } catch (error) {
      if (isDuplicate(error)) {
        throw new ApiException(409, 'hrm.already_clocked_in');
      }
      throw error;
    }
  }
  const row = await AttendanceModel.findOne({
    tenantId,
    employeeId: employee._id,
    dateKey: today,
  }).exec();
  if (!row) {
    throw new ApiException(404, 'hrm.not_clocked_in');
  }
  if (row.clockOutAt) {
    throw new ApiException(409, 'hrm.already_clocked_out');
  }
  row.clockOutAt = new Date();
  await row.save();
  return { id: String(row._id), dateKey: row.dateKey, clockInAt: row.clockInAt, clockOutAt: row.clockOutAt };
}

const employeeBody = z.object({
  employeeCode: z.string().trim().min(2).max(20),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(30).optional(),
  branchId: z.string().min(1),
  departmentId: z.string().min(1),
  designationId: z.string().min(1),
  orgRole: orgRoleSchema,
  roleId: z.string().min(1).optional(),
  dateOfBirth: z.string().min(8).optional(),
  gender: z.string().trim().max(20).optional(),
  address: z.string().trim().max(200).optional(),
  managerId: z.string().min(1).nullable().optional(),
  supervisorId: z.string().min(1).nullable().optional(),
  joiningDate: z.string().min(8),
});

async function resolveEmployeeRefs(
  tenantId: mongoose.Types.ObjectId,
  data: z.infer<typeof employeeBody>,
  currentId?: string,
) {
  const branch = await BranchModel.findOne({ _id: parseObjectId(data.branchId, 'branchId'), tenantId }).exec();
  const department = await DepartmentModel.findOne({
    _id: parseObjectId(data.departmentId, 'departmentId'),
    tenantId,
  }).exec();
  const designation = await DesignationModel.findOne({
    _id: parseObjectId(data.designationId, 'designationId'),
    tenantId,
  }).exec();
  if (!branch || !department || !designation) {
    throw new ApiException(404, 'hrm.employee_refs_not_found');
  }

  let managerId: mongoose.Types.ObjectId | undefined;
  let supervisorId: mongoose.Types.ObjectId | undefined;

  if (data.orgRole === 'SUPERVISOR') {
    if (!data.managerId) {
      throw new ApiException(400, 'hrm.manager_required');
    }
    const manager = await EmployeeModel.findOne({
      _id: parseObjectId(data.managerId, 'managerId'),
      tenantId,
      branchId: branch._id,
      orgRole: 'MANAGER',
      status: 'ACTIVE',
    }).exec();
    if (!manager || String(manager._id) === currentId) {
      throw new ApiException(400, 'hrm.manager_invalid');
    }
    managerId = manager._id;
  }

  if (data.orgRole === 'STAFF') {
    if (!data.supervisorId) {
      throw new ApiException(400, 'hrm.supervisor_required');
    }
    const supervisor = await EmployeeModel.findOne({
      _id: parseObjectId(data.supervisorId, 'supervisorId'),
      tenantId,
      branchId: branch._id,
      orgRole: 'SUPERVISOR',
      status: 'ACTIVE',
    }).exec();
    if (!supervisor || String(supervisor._id) === currentId) {
      throw new ApiException(400, 'hrm.supervisor_invalid');
    }
    supervisorId = supervisor._id;
    managerId = supervisor.managerId;
  }

  const joiningDate = new Date(data.joiningDate);
  if (Number.isNaN(joiningDate.getTime())) {
    throw new ApiException(400, 'hrm.joining_date_invalid');
  }

  let roleId: mongoose.Types.ObjectId | undefined;
  let dateOfBirth: Date | undefined;
  if (data.dateOfBirth) {
    dateOfBirth = new Date(data.dateOfBirth);
    if (Number.isNaN(dateOfBirth.getTime())) {
      throw new ApiException(400, 'hrm.birth_date_invalid');
    }
  }
  if (data.roleId) {
    const role = await HrmRoleModel.findOne({
      _id: parseObjectId(data.roleId, 'roleId'),
      tenantId,
    }).exec();
    if (!role) {
      throw new ApiException(404, 'hrm.role_not_found');
    }
    if (role.orgRole !== data.orgRole) {
      throw new ApiException(400, 'hrm.role_org_mismatch');
    }
    if (dateOfBirth) {
      const age = yearsBetween(dateOfBirth, new Date());
      if (age < role.minAge) {
        throw new ApiException(400, 'hrm.age_not_eligible');
      }
    } else if (role.minAge > 0) {
      throw new ApiException(400, 'hrm.birth_date_required');
    }
    roleId = role._id;
  }

  return {
    employeeCode: data.employeeCode.toUpperCase(),
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email.toLowerCase(),
    phone: data.phone ?? '',
    branchId: branch._id,
    departmentId: department._id,
    designationId: designation._id,
    orgRole: data.orgRole,
    managerId: managerId ?? undefined,
    supervisorId: supervisorId ?? undefined,
    joiningDate,
    dateOfBirth,
    gender: data.gender ?? '',
    address: data.address ?? '',
    roleId,
  };
}

async function serializeEmployees(
  tenantId: mongoose.Types.ObjectId,
  employees: Array<Record<string, unknown>>,
) {
  const [branches, departments, designations, roles, allEmployees] = await Promise.all([
    BranchModel.find({ tenantId }).lean().exec(),
    DepartmentModel.find({ tenantId }).lean().exec(),
    DesignationModel.find({ tenantId }).lean().exec(),
    HrmRoleModel.find({ tenantId }).lean().exec(),
    EmployeeModel.find({ tenantId }).lean().exec(),
  ]);
  const branchMap = new Map(branches.map((row) => [String(row._id), row]));
  const departmentMap = new Map(departments.map((row) => [String(row._id), row]));
  const designationMap = new Map(designations.map((row) => [String(row._id), row]));
  const roleMap = new Map(roles.map((row) => [String(row._id), row]));
  const employeeMap = new Map(allEmployees.map((row) => [String(row._id), row]));

  return employees.map((employee) => {
    const manager = employee.managerId ? employeeMap.get(String(employee.managerId)) : undefined;
    const supervisor = employee.supervisorId ? employeeMap.get(String(employee.supervisorId)) : undefined;
    const role = employee.roleId ? roleMap.get(String(employee.roleId)) : undefined;
    return {
      id: String(employee._id),
      employeeCode: employee.employeeCode,
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      phone: employee.phone,
      orgRole: employee.orgRole,
      status: employee.status,
      joiningDate: employee.joiningDate,
      dateOfBirth: employee.dateOfBirth ?? null,
      gender: employee.gender ?? '',
      address: employee.address ?? '',
      branch: namedId(branchMap.get(String(employee.branchId))),
      department: namedId(departmentMap.get(String(employee.departmentId))),
      designation: namedId(designationMap.get(String(employee.designationId))),
      role: role
        ? { id: String(role._id), name: role.name, minAge: role.minAge, orgRole: role.orgRole }
        : null,
      manager: manager
        ? { id: String(manager._id), name: `${manager.firstName} ${manager.lastName}` }
        : null,
      supervisor: supervisor
        ? { id: String(supervisor._id), name: `${supervisor.firstName} ${supervisor.lastName}` }
        : null,
    };
  });
}

function optionalId(value: unknown): string | null {
  return value ? String(value) : null;
}

function yearsBetween(from: Date, to: Date) {
  let age = to.getFullYear() - from.getFullYear();
  const month = to.getMonth() - from.getMonth();
  if (month < 0 || (month === 0 && to.getDate() < from.getDate())) {
    age -= 1;
  }
  return age;
}

function isDuplicate(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
}
