import { z } from 'zod';
import type { Request } from 'express';
import { ApiException } from './http-error';
import { HrmRoleModel } from './models-business';
import { parseObjectId, tenantObjectId } from './scope';
import { PERMISSIONS } from './shared';

const allowedPermissions = new Set(Object.values(PERMISSIONS));

const roleBody = z.object({
  name: z.string().trim().min(2).max(80),
  key: z.string().trim().min(2).max(40).optional(),
  description: z.string().trim().max(200).optional(),
  minAge: z.coerce.number().int().min(16).max(80).default(18),
  orgRole: z.enum(['MANAGER', 'SUPERVISOR', 'STAFF']),
  permissions: z.array(z.string()).default([]),
});

export async function listRoles(req: Request) {
  const rows = await HrmRoleModel.find({ tenantId: tenantObjectId(req) }).sort({ name: 1 }).lean().exec();
  return rows.map(serializeRole);
}

export async function createRole(req: Request) {
  const parsed = roleBody.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiException(400, 'validation.failed');
  }
  const permissions = parsed.data.permissions.filter((item) => allowedPermissions.has(item as never));
  try {
    const row = await HrmRoleModel.create({
      tenantId: tenantObjectId(req),
      name: parsed.data.name,
      key: slugKey(parsed.data.key || parsed.data.name),
      description: parsed.data.description ?? '',
      minAge: parsed.data.minAge,
      orgRole: parsed.data.orgRole,
      permissions,
    });
    return serializeRole(row);
  } catch (error) {
    if (typeof error === 'object' && error && 'code' in error && error.code === 11000) {
      throw new ApiException(409, 'hrm.role_exists');
    }
    throw error;
  }
}

export async function updateRole(req: Request) {
  const parsed = roleBody.partial().safeParse(req.body);
  if (!parsed.success) {
    throw new ApiException(400, 'validation.failed');
  }
  const row = await HrmRoleModel.findOne({
    _id: parseObjectId(req.params.id, 'roleId'),
    tenantId: tenantObjectId(req),
  }).exec();
  if (!row) {
    throw new ApiException(404, 'hrm.role_not_found');
  }
  if (parsed.data.name) row.name = parsed.data.name;
  if (parsed.data.key) row.key = slugKey(parsed.data.key);
  if (parsed.data.description !== undefined) row.description = parsed.data.description;
  if (parsed.data.minAge !== undefined) row.minAge = parsed.data.minAge;
  if (parsed.data.orgRole) row.orgRole = parsed.data.orgRole;
  if (parsed.data.permissions) {
    row.permissions = parsed.data.permissions.filter((item) => allowedPermissions.has(item as never));
  }
  await row.save();
  return serializeRole(row);
}

function serializeRole(row: {
  _id: unknown;
  name: string;
  key: string;
  description?: string;
  minAge: number;
  orgRole: string;
  permissions: string[];
}) {
  return {
    id: String(row._id),
    name: row.name,
    key: row.key,
    description: row.description ?? '',
    minAge: row.minAge,
    orgRole: row.orgRole,
    permissions: row.permissions,
  };
}

function slugKey(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}
