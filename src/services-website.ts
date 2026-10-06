import type { Request } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { ApiException } from './http-error';
import {
  AnnouncementModel,
  BankModel,
  BranchModel,
  CityModel,
  EmployeeModel,
  EnquiryModel,
  StateModel,
} from './models-business';
import { TenantModel } from './models';
import { namedId, parseObjectId, resolveLeadAccess, tenantObjectId } from './scope';
import { LOAN_TYPES } from './shared';

const loanType = z.enum(LOAN_TYPES as unknown as [string, ...string[]]);

export async function listBanks(req: Request) {
  const tenantId = tenantObjectId(req);
  const status = req.query.status ? String(req.query.status) : undefined;
  const rows = await BankModel.find({
    tenantId,
    ...(status ? { status } : {}),
  })
    .sort({ name: 1 })
    .lean()
    .exec();
  return rows.map((row) => ({
    id: String(row._id),
    name: row.name,
    code: row.code,
    logoUrl: row.logoUrl || '',
    status: row.status,
  }));
}

export async function createBank(req: Request) {
  const parsed = z
    .object({
      name: z.string().trim().min(2).max(120),
      code: z.string().trim().min(2).max(20),
      logoUrl: z.string().trim().max(500).optional(),
      status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
    })
    .safeParse(req.body);
  if (!parsed.success) throw new ApiException(400, 'validation.failed');
  const tenantId = tenantObjectId(req);
  try {
    const row = await BankModel.create({
      tenantId,
      name: parsed.data.name,
      code: parsed.data.code.toUpperCase(),
      logoUrl: parsed.data.logoUrl ?? '',
      status: parsed.data.status ?? 'ACTIVE',
    });
    return { id: String(row._id), name: row.name, code: row.code, logoUrl: row.logoUrl, status: row.status };
  } catch {
    throw new ApiException(409, 'website.bank_exists');
  }
}

export async function updateBank(req: Request) {
  const parsed = z
    .object({
      name: z.string().trim().min(2).max(120).optional(),
      code: z.string().trim().min(2).max(20).optional(),
      logoUrl: z.string().trim().max(500).optional(),
      status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
    })
    .safeParse(req.body);
  if (!parsed.success) throw new ApiException(400, 'validation.failed');
  const tenantId = tenantObjectId(req);
  const row = await BankModel.findOne({
    _id: parseObjectId(req.params.id, 'bankId'),
    tenantId,
  }).exec();
  if (!row) throw new ApiException(404, 'website.bank_not_found');
  if (parsed.data.name) row.name = parsed.data.name;
  if (parsed.data.code) row.code = parsed.data.code.toUpperCase();
  if (parsed.data.logoUrl !== undefined) row.logoUrl = parsed.data.logoUrl;
  if (parsed.data.status) row.status = parsed.data.status;
  await row.save();
  return { id: String(row._id), name: row.name, code: row.code, logoUrl: row.logoUrl, status: row.status };
}

export async function deleteBank(req: Request) {
  const tenantId = tenantObjectId(req);
  const row = await BankModel.findOneAndDelete({
    _id: parseObjectId(req.params.id, 'bankId'),
    tenantId,
  }).exec();
  if (!row) throw new ApiException(404, 'website.bank_not_found');
  return { id: String(row._id), deleted: true };
}

export async function listEnquiries(req: Request) {
  const tenantId = tenantObjectId(req);
  const rows = await EnquiryModel.find({ tenantId }).sort({ createdAt: -1 }).limit(200).lean().exec();
  const banks = await BankModel.find({ tenantId }).lean().exec();
  const bankMap = new Map(banks.map((b) => [String(b._id), b]));
  return rows.map((row) => ({
    id: String(row._id),
    name: row.name,
    email: row.email,
    phone: row.phone,
    loanType: row.loanType,
    loanAmount: row.loanAmount || 0,
    bank: namedId(bankMap.get(String(row.bankId))),
    message: row.message || '',
    status: row.status,
    createdAt: (row as { createdAt?: Date }).createdAt ?? null,
  }));
}

export async function createEnquiry(req: Request) {
  const parsed = z
    .object({
      tenantSlug: z.string().trim().min(1).optional(),
      name: z.string().trim().min(2).max(120),
      email: z.union([z.string().trim().email(), z.literal('')]).optional(),
      phone: z.string().trim().min(8).max(30),
      loanType: loanType.optional(),
      loanAmount: z.number().min(0).optional(),
      bankId: z.string().min(1).optional(),
      message: z.string().trim().max(1000).optional(),
    })
    .safeParse(req.body);
  if (!parsed.success) throw new ApiException(400, 'validation.failed');

  let tenantId: mongoose.Types.ObjectId;
  if (req.authUser?.tenantId) {
    tenantId = tenantObjectId(req);
  } else {
    const slug = parsed.data.tenantSlug || 'acme-hr';
    const tenant = await TenantModel.findOne({ slug, status: 'ACTIVE' }).exec();
    if (!tenant) throw new ApiException(404, 'auth.tenant_required');
    tenantId = tenant._id as mongoose.Types.ObjectId;
  }

  if (parsed.data.bankId) {
    const bank = await BankModel.findOne({
      _id: parseObjectId(parsed.data.bankId, 'bankId'),
      tenantId,
      status: 'ACTIVE',
    }).exec();
    if (!bank) throw new ApiException(400, 'website.bank_not_found');
  }

  const row = await EnquiryModel.create({
    tenantId,
    name: parsed.data.name,
    email: (parsed.data.email ?? '').toLowerCase(),
    phone: parsed.data.phone,
    loanType: parsed.data.loanType ?? 'PL',
    loanAmount: parsed.data.loanAmount ?? 0,
    bankId: parsed.data.bankId ? parseObjectId(parsed.data.bankId, 'bankId') : undefined,
    message: parsed.data.message ?? '',
    status: 'NEW',
  });

  return { id: String(row._id), status: row.status };
}

export async function listAnnouncements(req: Request) {
  const tenantId = tenantObjectId(req);
  const access = await resolveLeadAccess(req);
  const filter: Record<string, unknown> = { tenantId, status: 'ACTIVE' };

  const rows = await AnnouncementModel.find(filter).sort({ createdAt: -1 }).limit(100).lean().exec();
  return rows
    .filter((row) => {
      if (row.scope === 'ALL') return true;
      if (row.scope === 'STATE' && access.stateId) return String(row.stateId) === access.stateId;
      if (row.scope === 'CITY' && access.cityId) return String(row.cityId) === access.cityId;
      if (row.scope === 'BRANCH' && access.branchId) return String(row.branchId) === access.branchId;
      return access.scope === 'ALL';
    })
    .map((row) => ({
      id: String(row._id),
      title: row.title,
      body: row.body || '',
      kind: row.kind,
      imageUrl: row.imageUrl || '',
      scope: row.scope,
      status: row.status,
      createdAt: (row as { createdAt?: Date }).createdAt ?? null,
    }));
}

export async function createAnnouncement(req: Request) {
  const parsed = z
    .object({
      title: z.string().trim().min(2).max(160),
      body: z.string().trim().max(2000).optional(),
      kind: z.enum(['WISHES', 'LEAVE', 'POSTER', 'BIRTHDAY', 'GENERAL']).optional(),
      imageUrl: z.string().trim().max(500).optional(),
      scope: z.enum(['ALL', 'STATE', 'CITY', 'BRANCH']).optional(),
      stateId: z.string().min(1).optional(),
      cityId: z.string().min(1).optional(),
      branchId: z.string().min(1).optional(),
      status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
    })
    .safeParse(req.body);
  if (!parsed.success) throw new ApiException(400, 'validation.failed');
  const tenantId = tenantObjectId(req);
  const scope = parsed.data.scope ?? 'ALL';

  if (scope === 'STATE' && parsed.data.stateId) {
    const state = await StateModel.findOne({ _id: parseObjectId(parsed.data.stateId, 'stateId'), tenantId }).exec();
    if (!state) throw new ApiException(404, 'location.state_not_found');
  }
  if (scope === 'CITY' && parsed.data.cityId) {
    const city = await CityModel.findOne({ _id: parseObjectId(parsed.data.cityId, 'cityId'), tenantId }).exec();
    if (!city) throw new ApiException(404, 'location.city_not_found');
  }
  if (scope === 'BRANCH' && parsed.data.branchId) {
    const branch = await BranchModel.findOne({
      _id: parseObjectId(parsed.data.branchId, 'branchId'),
      tenantId,
    }).exec();
    if (!branch) throw new ApiException(404, 'location.branch_not_found');
  }

  const row = await AnnouncementModel.create({
    tenantId,
    title: parsed.data.title,
    body: parsed.data.body ?? '',
    kind: parsed.data.kind ?? 'GENERAL',
    imageUrl: parsed.data.imageUrl ?? '',
    scope,
    stateId: parsed.data.stateId ? parseObjectId(parsed.data.stateId, 'stateId') : undefined,
    cityId: parsed.data.cityId ? parseObjectId(parsed.data.cityId, 'cityId') : undefined,
    branchId: parsed.data.branchId ? parseObjectId(parsed.data.branchId, 'branchId') : undefined,
    status: parsed.data.status ?? 'ACTIVE',
    createdBy: req.authUser?.id ? new mongoose.Types.ObjectId(req.authUser.id) : undefined,
  });

  return {
    id: String(row._id),
    title: row.title,
    kind: row.kind,
    scope: row.scope,
    status: row.status,
  };
}

export async function listBirthdaysToday(req: Request) {
  const tenantId = tenantObjectId(req);
  const now = new Date();
  const month = now.getUTCMonth() + 1;
  const day = now.getUTCDate();
  const employees = await EmployeeModel.find({ tenantId, status: 'ACTIVE', dateOfBirth: { $exists: true } })
    .lean()
    .exec();
  const today = employees
    .filter((emp) => {
      if (!emp.dateOfBirth) return false;
      const dob = new Date(emp.dateOfBirth);
      return dob.getUTCMonth() + 1 === month && dob.getUTCDate() === day;
    })
    .map((emp) => ({
      id: String(emp._id),
      name: `${emp.firstName} ${emp.lastName}`,
      employeeCode: emp.employeeCode,
      photoUrl: emp.photoUrl || '/default-avatar.svg',
      branchId: String(emp.branchId),
      orgRole: emp.orgRole,
      wishCard: {
        title: `Happy Birthday, ${emp.firstName}!`,
        body: `Wishing ${emp.firstName} ${emp.lastName} a wonderful birthday today.`,
      },
    }));
  return { date: now.toISOString().slice(0, 10), birthdays: today };
}

/** Public active banks for enquiry forms (by tenant slug). */
export async function listPublicBanks(req: Request) {
  const slug = String(req.query.tenantSlug || 'acme-hr');
  const tenant = await TenantModel.findOne({ slug, status: 'ACTIVE' }).exec();
  if (!tenant) throw new ApiException(404, 'auth.tenant_required');
  const rows = await BankModel.find({ tenantId: tenant._id, status: 'ACTIVE' }).sort({ name: 1 }).lean().exec();
  return rows.map((row) => ({
    id: String(row._id),
    name: row.name,
    code: row.code,
    logoUrl: row.logoUrl || '',
  }));
}
