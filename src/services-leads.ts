import { z } from 'zod';
import type { Request } from 'express';
import { randomUUID } from 'node:crypto';
import { ApiException } from './http-error';
import { parseCsv } from './csv';
import {
  BankModel,
  BranchModel,
  CityModel,
  CountryModel,
  EmployeeModel,
  LeadFollowUpModel,
  LeadModel,
  StateModel,
} from './models-business';
import { applyLeadAccessFilter, namedId, parseObjectId, resolveLeadAccess, tenantObjectId } from './scope';
import mongoose from 'mongoose';
import { CALLED_STATUSES, CONNECTED_STATUSES, LEAD_STATUSES, LOAN_TYPES } from './shared';

const leadStatus = z.enum(LEAD_STATUSES as unknown as [string, ...string[]]);
const loanType = z.enum(LOAN_TYPES as unknown as [string, ...string[]]);

const leadBody = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.union([z.string().trim().email().max(255), z.literal('')]).optional(),
  phone: z.string().trim().max(30).optional(),
  source: z.string().trim().max(80).optional(),
  campaignName: z.string().trim().max(120).optional(),
  loanType: loanType.optional(),
  rsm: z.string().trim().max(80).optional(),
  team: z.string().trim().max(80).optional(),
  bdoCode: z.string().trim().max(40).optional(),
  called: z.boolean().optional(),
  connected: z.boolean().optional(),
  countryId: z.string().min(1),
  stateId: z.string().min(1),
  cityId: z.string().min(1),
  branchId: z.string().min(1),
  assignedEmployeeId: z.string().min(1).nullable().optional(),
  status: leadStatus.optional(),
  notes: z.string().trim().max(1000).optional(),
});

function deriveFlags(status: string, called?: boolean, connected?: boolean) {
  const isCalled = called ?? CALLED_STATUSES.includes(status as (typeof CALLED_STATUSES)[number]);
  const isConnected =
    connected ?? CONNECTED_STATUSES.includes(status as (typeof CONNECTED_STATUSES)[number]);
  return { called: Boolean(isCalled), connected: Boolean(isConnected) };
}

export async function listLeads(req: Request) {
  const tenantId = tenantObjectId(req);
  const access = await resolveLeadAccess(req);
  const filter: Record<string, unknown> = applyLeadAccessFilter({ tenantId }, access);
  if (req.query.countryId) filter.countryId = parseObjectId(String(req.query.countryId), 'countryId');
  if (req.query.stateId) filter.stateId = parseObjectId(String(req.query.stateId), 'stateId');
  if (req.query.cityId) filter.cityId = parseObjectId(String(req.query.cityId), 'cityId');
  if (req.query.branchId) filter.branchId = parseObjectId(String(req.query.branchId), 'branchId');
  if (req.query.status) filter.status = String(req.query.status);
  if (req.query.campaignName) filter.campaignName = String(req.query.campaignName);
  if (req.query.loanType) filter.loanType = String(req.query.loanType);
  if (req.query.assignedEmployeeId) {
    filter.assignedEmployeeId = parseObjectId(String(req.query.assignedEmployeeId), 'assignedEmployeeId');
  }
  if (req.query.q) {
    const q = String(req.query.q).trim();
    filter.$or = [
      { name: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } },
      { phone: { $regex: q, $options: 'i' } },
      { campaignName: { $regex: q, $options: 'i' } },
    ];
  }
  const rows = await LeadModel.find(filter).sort({ createdAt: -1 }).limit(500).lean().exec();
  return serializeLeads(tenantId, rows);
}

export async function getLead(req: Request) {
  const tenantId = tenantObjectId(req);
  const access = await resolveLeadAccess(req);
  const filter = applyLeadAccessFilter(
    { _id: parseObjectId(req.params.id, 'leadId'), tenantId },
    access,
  );
  const lead = await LeadModel.findOne(filter).lean().exec();
  if (!lead) {
    throw new ApiException(404, 'lead.not_found');
  }
  const [serialized] = await serializeLeads(tenantId, [lead]);
  const history = await listFollowUps(req, String(lead._id));
  return { ...serialized, history };
}

export async function createLead(req: Request) {
  const parsed = leadBody.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiException(400, 'validation.failed');
  }
  const tenantId = tenantObjectId(req);
  const refs = await resolveLeadRefs(tenantId, parsed.data);
  const status = parsed.data.status ?? 'NOT_CALLED';
  const flags = deriveFlags(status, parsed.data.called, parsed.data.connected);
  const lead = await LeadModel.create({
    tenantId,
    ...refs,
    campaignName: parsed.data.campaignName ?? '',
    loanType: parsed.data.loanType ?? 'PL',
    rsm: parsed.data.rsm ?? '',
    team: parsed.data.team ?? '',
    bdoCode: parsed.data.bdoCode ?? '',
    status,
    ...flags,
    calledAt: flags.called ? new Date() : undefined,
    notes: parsed.data.notes ?? '',
    source: parsed.data.source || 'manual',
  });
  const [serialized] = await serializeLeads(tenantId, [lead.toObject()]);
  return serialized;
}

export async function updateLead(req: Request) {
  const parsed = leadBody.partial().safeParse(req.body);
  if (!parsed.success) {
    throw new ApiException(400, 'validation.failed');
  }
  const tenantId = tenantObjectId(req);
  const access = await resolveLeadAccess(req);
  const lead = await LeadModel.findOne(
    applyLeadAccessFilter({ _id: parseObjectId(req.params.id, 'leadId'), tenantId }, access),
  ).exec();
  if (!lead) {
    throw new ApiException(404, 'lead.not_found');
  }
  const merged = {
    name: parsed.data.name ?? lead.name,
    email: parsed.data.email ?? lead.email,
    phone: parsed.data.phone ?? lead.phone,
    source: parsed.data.source ?? lead.source,
    campaignName: parsed.data.campaignName ?? lead.campaignName,
    loanType: parsed.data.loanType ?? lead.loanType,
    rsm: parsed.data.rsm ?? lead.rsm,
    team: parsed.data.team ?? lead.team,
    bdoCode: parsed.data.bdoCode ?? lead.bdoCode,
    countryId: parsed.data.countryId ?? String(lead.countryId),
    stateId: parsed.data.stateId ?? String(lead.stateId),
    cityId: parsed.data.cityId ?? String(lead.cityId),
    branchId: parsed.data.branchId ?? String(lead.branchId),
    assignedEmployeeId:
      parsed.data.assignedEmployeeId === undefined
        ? lead.assignedEmployeeId
          ? String(lead.assignedEmployeeId)
          : null
        : parsed.data.assignedEmployeeId,
    status: parsed.data.status ?? lead.status,
    notes: parsed.data.notes ?? lead.notes,
    called: parsed.data.called,
    connected: parsed.data.connected,
  };
  const refs = await resolveLeadRefs(tenantId, merged);
  const flags = deriveFlags(merged.status, merged.called, merged.connected);
  Object.assign(lead, refs, {
    status: merged.status,
    notes: merged.notes,
    source: merged.source,
    campaignName: merged.campaignName,
    loanType: merged.loanType,
    rsm: merged.rsm,
    team: merged.team,
    bdoCode: merged.bdoCode,
    ...flags,
  });
  if (flags.called && !lead.calledAt) {
    lead.calledAt = new Date();
  }
  await lead.save();
  const [serialized] = await serializeLeads(tenantId, [lead.toObject()]);
  return serialized;
}

export async function listFollowUps(req: Request, leadId = req.params.id) {
  const tenantId = tenantObjectId(req);
  const access = await resolveLeadAccess(req);
  const lead = await LeadModel.findOne(
    applyLeadAccessFilter({ _id: parseObjectId(leadId, 'leadId'), tenantId }, access),
  ).exec();
  if (!lead) {
    throw new ApiException(404, 'lead.not_found');
  }
  const rows = await LeadFollowUpModel.find({ tenantId, leadId: lead._id })
    .sort({ createdAt: -1 })
    .lean()
    .exec();
  return rows.map((row) => ({
    id: String(row._id),
    note: row.note,
    nextFollowUpAt: row.nextFollowUpAt ?? null,
    statusAfter: row.statusAfter || null,
    createdAt: (row as { createdAt?: Date }).createdAt ?? null,
    createdBy: String(row.createdBy),
  }));
}

export async function createFollowUp(req: Request) {
  const parsed = z
    .object({
      note: z.string().trim().min(2).max(1000),
      nextFollowUpAt: z.string().optional(),
      reminderAt: z.string().optional(),
      status: leadStatus.optional(),
      remarks: z.string().trim().max(1000).optional(),
    })
    .safeParse(req.body);
  if (!parsed.success) {
    throw new ApiException(400, 'validation.failed');
  }
  const tenantId = tenantObjectId(req);
  const access = await resolveLeadAccess(req);
  const lead = await LeadModel.findOne(
    applyLeadAccessFilter({ _id: parseObjectId(req.params.id, 'leadId'), tenantId }, access),
  ).exec();
  if (!lead) {
    throw new ApiException(404, 'lead.not_found');
  }
  if (
    (parsed.data.status === 'LOGIN_APPROVED' || parsed.data.status === 'LOGIN_REJECTED') &&
    !parsed.data.remarks?.trim() &&
    !parsed.data.note?.trim()
  ) {
    throw new ApiException(400, 'lead.remarks_required');
  }
  const nextFollowUpAt = parsed.data.nextFollowUpAt ? new Date(parsed.data.nextFollowUpAt) : undefined;
  if (nextFollowUpAt && Number.isNaN(nextFollowUpAt.getTime())) {
    throw new ApiException(400, 'lead.followup_date_invalid');
  }
  const reminderAt = parsed.data.reminderAt ? new Date(parsed.data.reminderAt) : nextFollowUpAt;
  if (reminderAt && Number.isNaN(reminderAt.getTime())) {
    throw new ApiException(400, 'lead.followup_date_invalid');
  }
  if (parsed.data.status) {
    lead.status = parsed.data.status as (typeof LEAD_STATUSES)[number];
    const flags = deriveFlags(parsed.data.status);
    lead.called = flags.called;
    lead.connected = flags.connected;
    if (flags.called && !lead.calledAt) {
      lead.calledAt = new Date();
    }
  }
  if (parsed.data.remarks?.trim()) {
    lead.loginRemarks = parsed.data.remarks.trim();
  }
  if (nextFollowUpAt) {
    lead.nextFollowUpAt = nextFollowUpAt;
  }
  if (reminderAt) {
    lead.reminderAt = reminderAt;
    lead.reminderDone = false;
    lead.nextFollowUpAt = reminderAt;
  }
  await lead.save();
  const note =
    parsed.data.remarks?.trim() && parsed.data.status?.startsWith('LOGIN_')
      ? `${parsed.data.note}\nRemarks: ${parsed.data.remarks.trim()}`
      : parsed.data.note;
  const followUp = await LeadFollowUpModel.create({
    tenantId,
    leadId: lead._id,
    note,
    nextFollowUpAt,
    reminderAt,
    statusAfter: parsed.data.status ?? lead.status,
    createdBy: new mongoose.Types.ObjectId(req.authUser!.id),
  });
  return {
    id: String(followUp._id),
    note: followUp.note,
    nextFollowUpAt: followUp.nextFollowUpAt ?? null,
    statusAfter: followUp.statusAfter,
    leadStatus: lead.status,
    loginRemarks: lead.loginRemarks || '',
  };
}

function parseYn(value: string | undefined): boolean | undefined {
  if (!value) return undefined;
  const v = value.trim().toLowerCase();
  if (['y', 'yes', '1', 'true'].includes(v)) return true;
  if (['n', 'no', '0', 'false'].includes(v)) return false;
  return undefined;
}

function normalizeImportStatus(raw: string | undefined): string {
  if (!raw) return 'NOT_CALLED';
  const key = raw.trim().toUpperCase().replace(/[\s-]+/g, '_');
  const aliases: Record<string, string> = {
    NOT_CALLED: 'NOT_CALLED',
    NEW: 'NOT_CALLED',
    CALLED_NOT_CONTACTED: 'CALLED_NOT_CONTACTED',
    CONTACTED_NOT_INTERESTED: 'CONTACTED_NOT_INTERESTED',
    NOT_INTERESTED: 'CONTACTED_NOT_INTERESTED',
    CONTACTED_FOLLOWUP: 'CONTACTED_FOLLOWUP',
    FOLLOWUP: 'CONTACTED_FOLLOWUP',
    FOLLOW_UP: 'CONTACTED_FOLLOWUP',
    CONTACTED_NOT_ELIGIBLE: 'CONTACTED_NOT_ELIGIBLE',
    NOT_ELIGIBLE: 'CONTACTED_NOT_ELIGIBLE',
    CONTACTED_INTERESTED: 'CONTACTED_INTERESTED',
    INTERESTED: 'CONTACTED_INTERESTED',
    LOGIN: 'LOGIN',
    DISBURSED: 'DISBURSED',
    RNR: 'RNR',
  };
  return aliases[key] ?? (LEAD_STATUSES.includes(key as never) ? key : 'NOT_CALLED');
}

export async function importLeads(req: Request) {
  const parsed = z
    .object({
      branchId: z.string().min(1),
      files: z
        .array(
          z.object({
            name: z.string().min(1).max(200),
            csvText: z.string().min(10).max(2_000_000),
          }),
        )
        .min(1)
        .max(10),
    })
    .safeParse(req.body);
  if (!parsed.success) {
    throw new ApiException(400, 'validation.failed');
  }

  const tenantId = tenantObjectId(req);
  const access = await resolveLeadAccess(req);
  const [countries, states, cities, branches] = await Promise.all([
    CountryModel.find({ tenantId }).lean().exec(),
    StateModel.find({ tenantId }).lean().exec(),
    CityModel.find({ tenantId }).lean().exec(),
    BranchModel.find({ tenantId }).lean().exec(),
  ]);

  const defaultMatch = resolveLocationFromBranchId(parsed.data.branchId, {
    countries,
    states,
    cities,
    branches,
  });
  if (!defaultMatch) {
    throw new ApiException(400, 'lead.import.location_not_found');
  }
  if (access.scope === 'BRANCH' && access.branchId && String(defaultMatch.branchId) !== access.branchId) {
    throw new ApiException(403, 'lead.import.out_of_scope');
  }
  if (access.scope === 'CITY' && access.cityId && String(defaultMatch.cityId) !== access.cityId) {
    throw new ApiException(403, 'lead.import.out_of_scope');
  }
  if (access.scope === 'STATE' && access.stateId && String(defaultMatch.stateId) !== access.stateId) {
    throw new ApiException(403, 'lead.import.out_of_scope');
  }

  const batchId = randomUUID();
  const results = [];

  for (const file of parsed.data.files) {
    const rows = parseCsv(file.csvText);
    let created = 0;
    const errors: Array<{ row: number; message: string }> = [];
    for (const [index, row] of rows.entries()) {
      const name =
        row.customer_name ||
        row.customername ||
        row.name ||
        [row.first_name, row.last_name].filter(Boolean).join(' ').trim();
      if (!name) {
        errors.push({ row: index + 2, message: 'lead.import.name_required' });
        continue;
      }
      const csvMatch = matchLocation(row, { countries, states, cities, branches });
      const match = csvMatch ?? defaultMatch;
      if (!match) {
        errors.push({ row: index + 2, message: 'lead.import.location_not_found' });
        continue;
      }
      if (access.scope === 'BRANCH' && access.branchId && String(match.branchId) !== access.branchId) {
        errors.push({ row: index + 2, message: 'lead.import.out_of_scope' });
        continue;
      }
      if (access.scope === 'CITY' && access.cityId && String(match.cityId) !== access.cityId) {
        errors.push({ row: index + 2, message: 'lead.import.out_of_scope' });
        continue;
      }
      if (access.scope === 'STATE' && access.stateId && String(match.stateId) !== access.stateId) {
        errors.push({ row: index + 2, message: 'lead.import.out_of_scope' });
        continue;
      }

      const status = normalizeImportStatus(row.status);
      const called = parseYn(row.called) ?? deriveFlags(status).called;
      const connected = parseYn(row.connected) ?? deriveFlags(status).connected;
      const loan = (row.loan_type || row.loantype || 'PL').toUpperCase();
      const loanTypeValue = LOAN_TYPES.includes(loan as never) ? loan : 'PL';

      await LeadModel.create({
        tenantId,
        name,
        email: (row.email ?? '').toLowerCase(),
        phone: row.phone ?? row.phone_no ?? row.phoneno ?? row.mobile ?? row.phonenumber ?? '',
        source: row.source || file.name,
        campaignName: row.campaign_name || row.campaignname || row.campaign || '',
        loanType: loanTypeValue,
        rsm: row.rsm ?? row.regional_lead ?? '',
        team: row.team ?? '',
        bdoCode: row.bdo_code || row.bdo || '',
        countryId: match.countryId,
        stateId: match.stateId,
        cityId: match.cityId,
        branchId: match.branchId,
        status,
        called,
        connected,
        calledAt: called ? new Date() : undefined,
        notes: row.notes ?? '',
        importBatchId: batchId,
        assignedEmployeeId:
          access.scope === 'SELF' && access.employeeId
            ? new mongoose.Types.ObjectId(access.employeeId)
            : undefined,
      });
      created += 1;
    }
    results.push({ fileName: file.name, created, skipped: errors.length, errors });
  }

  return { batchId, files: results };
}

export async function listReminders(req: Request) {
  const tenantId = tenantObjectId(req);
  const access = await resolveLeadAccess(req);
  const now = new Date();
  const horizon = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  const filter = applyLeadAccessFilter(
    {
      tenantId,
      status: { $nin: ['DISBURSED', 'WON', 'LOST', 'CONTACTED_NOT_INTERESTED'] },
      reminderDone: { $ne: true },
      $or: [{ reminderAt: { $lte: horizon } }, { nextFollowUpAt: { $lte: horizon } }],
    },
    access,
  );
  const rows = await LeadModel.find(filter)
    .sort({ reminderAt: 1, nextFollowUpAt: 1 })
    .limit(100)
    .lean()
    .exec();
  return serializeLeads(tenantId, rows);
}

export async function completeReminder(req: Request) {
  const tenantId = tenantObjectId(req);
  const access = await resolveLeadAccess(req);
  const lead = await LeadModel.findOne(
    applyLeadAccessFilter({ _id: parseObjectId(req.params.id, 'leadId'), tenantId }, access),
  ).exec();
  if (!lead) {
    throw new ApiException(404, 'lead.not_found');
  }
  lead.reminderDone = true;
  await lead.save();
  return { id: String(lead._id), reminderDone: true };
}

async function resolveLeadRefs(
  tenantId: mongoose.Types.ObjectId,
  data: {
    name: string;
    email?: string;
    phone?: string;
    source?: string;
    countryId: string;
    stateId: string;
    cityId: string;
    branchId: string;
    assignedEmployeeId?: string | null;
  },
) {
  const country = await CountryModel.findOne({
    _id: parseObjectId(data.countryId, 'countryId'),
    tenantId,
  }).exec();
  const state = await StateModel.findOne({
    _id: parseObjectId(data.stateId, 'stateId'),
    tenantId,
    countryId: country?._id,
  }).exec();
  const city = await CityModel.findOne({
    _id: parseObjectId(data.cityId, 'cityId'),
    tenantId,
    stateId: state?._id,
  }).exec();
  const branch = await BranchModel.findOne({
    _id: parseObjectId(data.branchId, 'branchId'),
    tenantId,
    cityId: city?._id,
  }).exec();
  if (!country || !state || !city || !branch) {
    throw new ApiException(400, 'lead.location_mismatch');
  }
  let assignedEmployeeId: mongoose.Types.ObjectId | undefined;
  if (data.assignedEmployeeId) {
    const employee = await EmployeeModel.findOne({
      _id: parseObjectId(data.assignedEmployeeId, 'assignedEmployeeId'),
      tenantId,
      branchId: branch._id,
      status: 'ACTIVE',
    }).exec();
    if (!employee) {
      throw new ApiException(400, 'lead.assignee_invalid');
    }
    assignedEmployeeId = employee._id;
  }
  return {
    name: data.name,
    email: data.email ?? '',
    phone: data.phone ?? '',
    source: data.source || 'manual',
    countryId: country._id,
    stateId: state._id,
    cityId: city._id,
    branchId: branch._id,
    assignedEmployeeId,
  };
}

async function serializeLeads(tenantId: mongoose.Types.ObjectId, leads: Array<Record<string, unknown>>) {
  const [countries, states, cities, branches, employees, banks] = await Promise.all([
    CountryModel.find({ tenantId }).lean().exec(),
    StateModel.find({ tenantId }).lean().exec(),
    CityModel.find({ tenantId }).lean().exec(),
    BranchModel.find({ tenantId }).lean().exec(),
    EmployeeModel.find({ tenantId }).lean().exec(),
    BankModel.find({ tenantId }).lean().exec(),
  ]);
  const countryMap = new Map(countries.map((row) => [String(row._id), row]));
  const stateMap = new Map(states.map((row) => [String(row._id), row]));
  const cityMap = new Map(cities.map((row) => [String(row._id), row]));
  const branchMap = new Map(branches.map((row) => [String(row._id), row]));
  const employeeMap = new Map(employees.map((row) => [String(row._id), row]));
  const bankMap = new Map(banks.map((row) => [String(row._id), row]));

  return leads.map((lead) => {
    const employee = lead.assignedEmployeeId ? employeeMap.get(String(lead.assignedEmployeeId)) : undefined;
    const bank = lead.bankId ? bankMap.get(String(lead.bankId)) : undefined;
    return {
      id: String(lead._id),
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      source: lead.source,
      campaignName: lead.campaignName || '',
      loanType: lead.loanType || 'PL',
      loanAmount: Number(lead.loanAmount || 0),
      bankId: lead.bankId ? String(lead.bankId) : null,
      bank: bank ? { id: String(bank._id), name: bank.name, code: bank.code } : null,
      rsm: lead.rsm || '',
      team: lead.team || '',
      bdoCode: lead.bdoCode || '',
      called: Boolean(lead.called),
      connected: Boolean(lead.connected),
      calledAt: lead.calledAt ?? null,
      status: lead.status,
      notes: lead.notes,
      loginRemarks: lead.loginRemarks || '',
      nextFollowUpAt: lead.nextFollowUpAt ?? null,
      reminderAt: lead.reminderAt ?? lead.nextFollowUpAt ?? null,
      reminderDone: Boolean(lead.reminderDone),
      importBatchId: lead.importBatchId || null,
      country: namedId(countryMap.get(String(lead.countryId))),
      state: namedId(stateMap.get(String(lead.stateId))),
      city: namedId(cityMap.get(String(lead.cityId))),
      branch: namedId(branchMap.get(String(lead.branchId))),
      assignedEmployee: employee
        ? { id: String(employee._id), name: `${employee.firstName} ${employee.lastName}` }
        : null,
      createdAt: lead.createdAt ?? null,
    };
  });
}

type LocationMaps = {
  countries: Array<{ _id: mongoose.Types.ObjectId; name: string; code: string }>;
  states: Array<{ _id: mongoose.Types.ObjectId; countryId: mongoose.Types.ObjectId; name: string; code: string }>;
  cities: Array<{ _id: mongoose.Types.ObjectId; stateId: mongoose.Types.ObjectId; name: string }>;
  branches: Array<{ _id: mongoose.Types.ObjectId; cityId: mongoose.Types.ObjectId; name: string; code: string }>;
};

function resolveLocationFromBranchId(branchId: string, maps: LocationMaps) {
  const branch = maps.branches.find((item) => String(item._id) === branchId);
  if (!branch) return null;
  const city = maps.cities.find((item) => String(item._id) === String(branch.cityId));
  if (!city) return null;
  const state = maps.states.find((item) => String(item._id) === String(city.stateId));
  if (!state) return null;
  const country = maps.countries.find((item) => String(item._id) === String(state.countryId));
  if (!country) return null;
  return {
    countryId: country._id,
    stateId: state._id,
    cityId: city._id,
    branchId: branch._id,
  };
}

function matchLocation(row: Record<string, string>, maps: LocationMaps) {
  const countryKey = (row.country || row.country_code || '').toLowerCase();
  const stateKey = (row.state || row.state_code || '').toLowerCase();
  const cityKey = (row.city || '').toLowerCase();
  const branchKey = (row.branch || row.branch_code || '').toLowerCase();

  // Prefer branch-only walk-up when a branch is present without full geo columns.
  if (branchKey && (!countryKey || !stateKey || !cityKey)) {
    const branch = maps.branches.find(
      (item) => item.name.toLowerCase() === branchKey || item.code.toLowerCase() === branchKey,
    );
    if (branch) {
      return resolveLocationFromBranchId(String(branch._id), maps);
    }
  }

  if (!countryKey || !stateKey || !cityKey || !branchKey) {
    return null;
  }

  const country = maps.countries.find(
    (item) => item.name.toLowerCase() === countryKey || item.code.toLowerCase() === countryKey,
  );
  if (!country) return null;
  const state = maps.states.find(
    (item) =>
      String(item.countryId) === String(country._id) &&
      (item.name.toLowerCase() === stateKey || item.code.toLowerCase() === stateKey),
  );
  if (!state) return null;
  const city = maps.cities.find(
    (item) => String(item.stateId) === String(state._id) && item.name.toLowerCase() === cityKey,
  );
  if (!city) return null;
  const branch = maps.branches.find(
    (item) =>
      String(item.cityId) === String(city._id) &&
      (item.name.toLowerCase() === branchKey || item.code.toLowerCase() === branchKey),
  );
  if (!branch) return null;
  return {
    countryId: country._id,
    stateId: state._id,
    cityId: city._id,
    branchId: branch._id,
  };
}
