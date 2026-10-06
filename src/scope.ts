import mongoose from 'mongoose';
import type { Request } from 'express';
import { ApiException } from './http-error';
import { BranchModel, CityModel, EmployeeModel } from './models-business';
import type { AccessScope, OrgRole } from './shared';
import { ORG_ROLE_SCOPE, ROLE_KEYS } from './shared';

export function tenantObjectId(req: Request): mongoose.Types.ObjectId {
  return new mongoose.Types.ObjectId(req.authUser!.tenantId);
}

export function parseObjectId(value: string, key = 'id'): mongoose.Types.ObjectId {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new ApiException(400, `validation.invalid_${key}`);
  }
  return new mongoose.Types.ObjectId(value);
}

export function dateKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function namedId(doc: { _id: unknown; name?: string; code?: string } | null | undefined) {
  if (!doc) {
    return null;
  }
  return {
    id: String(doc._id),
    name: doc.name ?? '',
    code: doc.code ?? '',
  };
}

export type LeadAccessContext = {
  scope: AccessScope;
  employeeId?: string;
  branchId?: string;
  cityId?: string;
  stateId?: string;
  teamEmployeeIds?: string[];
};

function scopeFromOrgRole(orgRole: string): AccessScope {
  return ORG_ROLE_SCOPE[orgRole as OrgRole] ?? 'SELF';
}

export async function resolveLeadAccess(req: Request): Promise<LeadAccessContext> {
  const auth = req.authUser!;
  const isOwnerOrAdmin =
    auth.roleKeys.includes(ROLE_KEYS.TENANT_OWNER) || auth.roleKeys.includes(ROLE_KEYS.TENANT_ADMIN);

  if (isOwnerOrAdmin && (auth.accessScope === 'ALL' || !auth.employeeId)) {
    return { scope: 'ALL' };
  }

  if (!auth.employeeId) {
    if (auth.accessScope && auth.accessScope !== 'SELF') {
      return { scope: auth.accessScope as AccessScope };
    }
    return isOwnerOrAdmin ? { scope: 'ALL' } : { scope: 'SELF', employeeId: undefined, teamEmployeeIds: [] };
  }

  const employee = await EmployeeModel.findById(auth.employeeId).lean().exec();
  if (!employee) {
    return isOwnerOrAdmin ? { scope: 'ALL' } : { scope: 'SELF', employeeId: auth.employeeId };
  }

  const branch = await BranchModel.findById(employee.branchId).lean().exec();
  const city = branch ? await CityModel.findById(branch.cityId).lean().exec() : null;

  const roleScope = scopeFromOrgRole(String(employee.orgRole));
  const effectiveScope: AccessScope =
    auth.accessScope && auth.accessScope !== 'ALL' ? (auth.accessScope as AccessScope) : roleScope;

  if (effectiveScope === 'ALL' || employee.orgRole === 'HEAD') {
    return { scope: 'ALL' };
  }

  const stateId = employee.scopeStateId
    ? String(employee.scopeStateId)
    : city
      ? String(city.stateId)
      : undefined;
  const cityId = employee.scopeCityId ? String(employee.scopeCityId) : city ? String(city._id) : undefined;

  const context: LeadAccessContext = {
    scope: effectiveScope,
    employeeId: String(employee._id),
    branchId: String(employee.branchId),
    cityId,
    stateId,
  };

  if (effectiveScope === 'TEAM') {
    context.teamEmployeeIds = await collectReportEmployeeIds(employee.tenantId, String(employee._id));
  }

  return context;
}

/** Self + all descendants via managerId / supervisorId (recursive). */
export async function collectReportEmployeeIds(
  tenantId: mongoose.Types.ObjectId,
  rootEmployeeId: string,
): Promise<string[]> {
  const ids = new Set<string>([rootEmployeeId]);
  let frontier: mongoose.Types.ObjectId[] = [new mongoose.Types.ObjectId(rootEmployeeId)];
  while (frontier.length) {
    const reports = await EmployeeModel.find({
      tenantId,
      status: 'ACTIVE',
      $or: [{ managerId: { $in: frontier } }, { supervisorId: { $in: frontier } }],
    })
      .select('_id')
      .lean()
      .exec();
    const next: mongoose.Types.ObjectId[] = [];
    for (const row of reports) {
      const id = String(row._id);
      if (!ids.has(id)) {
        ids.add(id);
        next.push(row._id);
      }
    }
    frontier = next;
  }
  return [...ids];
}

/** Mongo filter for employees visible to the current user (hierarchy / geo scope). */
export async function buildEmployeeAccessFilter(req: Request): Promise<{
  tenantId: mongoose.Types.ObjectId;
  access: LeadAccessContext;
  filter: Record<string, unknown>;
}> {
  const tenantId = tenantObjectId(req);
  const access = await resolveLeadAccess(req);
  const filter: Record<string, unknown> = { tenantId };

  if (access.scope === 'ALL') {
    return { tenantId, access, filter };
  }
  if (access.scope === 'BRANCH' && access.branchId) {
    filter.branchId = new mongoose.Types.ObjectId(access.branchId);
  } else if (access.scope === 'CITY' && access.cityId) {
    const branches = await BranchModel.find({ tenantId, cityId: access.cityId }).select('_id').lean().exec();
    filter.branchId = { $in: branches.map((b) => b._id) };
  } else if (access.scope === 'STATE' && access.stateId) {
    const cities = await CityModel.find({ tenantId, stateId: access.stateId }).select('_id').lean().exec();
    const branches = await BranchModel.find({
      tenantId,
      cityId: { $in: cities.map((c) => c._id) },
    })
      .select('_id')
      .lean()
      .exec();
    filter.branchId = { $in: branches.map((b) => b._id) };
  } else if (access.scope === 'TEAM' && access.teamEmployeeIds?.length) {
    filter._id = { $in: access.teamEmployeeIds.map((id) => new mongoose.Types.ObjectId(id)) };
  } else if (access.employeeId) {
    filter._id = new mongoose.Types.ObjectId(access.employeeId);
  } else {
    filter._id = new mongoose.Types.ObjectId('000000000000000000000000');
  }

  return { tenantId, access, filter };
}

export async function assertEmployeeInAccess(req: Request, employeeId: string) {
  const { filter, tenantId } = await buildEmployeeAccessFilter(req);
  const row = await EmployeeModel.findOne({
    ...filter,
    _id: parseObjectId(employeeId, 'employeeId'),
    tenantId,
  })
    .select('_id')
    .lean()
    .exec();
  if (!row) {
    throw new ApiException(403, 'hrm.employee_out_of_scope');
  }
}

export function applyLeadAccessFilter(
  filter: Record<string, unknown>,
  access: LeadAccessContext,
): Record<string, unknown> {
  if (access.scope === 'ALL') {
    return filter;
  }
  if (access.scope === 'STATE' && access.stateId) {
    filter.stateId = new mongoose.Types.ObjectId(access.stateId);
    return filter;
  }
  if (access.scope === 'CITY' && access.cityId) {
    filter.cityId = new mongoose.Types.ObjectId(access.cityId);
    return filter;
  }
  if (access.scope === 'BRANCH' && access.branchId) {
    filter.branchId = new mongoose.Types.ObjectId(access.branchId);
    return filter;
  }
  if (access.scope === 'TEAM' && access.teamEmployeeIds?.length) {
    filter.assignedEmployeeId = {
      $in: access.teamEmployeeIds.map((id) => new mongoose.Types.ObjectId(id)),
    };
    return filter;
  }
  if (access.employeeId) {
    filter.assignedEmployeeId = new mongoose.Types.ObjectId(access.employeeId);
  } else {
    filter._id = new mongoose.Types.ObjectId('000000000000000000000000');
  }
  return filter;
}
