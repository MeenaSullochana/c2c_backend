import type { Request } from 'express';
import { BranchModel, CityModel, EmployeeModel, LeadModel, StateModel } from './models-business';
import { applyLeadAccessFilter, parseObjectId, resolveLeadAccess, tenantObjectId } from './scope';
import { CALLED_STATUSES, CONNECTED_STATUSES, LEAD_STATUS_LABELS } from './shared';

function pct(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 10000) / 100;
}

export async function getC2cDashboard(req: Request) {
  const tenantId = tenantObjectId(req);
  const access = await resolveLeadAccess(req);
  const filter: Record<string, unknown> = applyLeadAccessFilter({ tenantId }, access);

  if (req.query.campaignName) filter.campaignName = String(req.query.campaignName);
  if (req.query.loanType) filter.loanType = String(req.query.loanType);
  if (req.query.rsm) filter.rsm = String(req.query.rsm);
  if (req.query.team) filter.team = String(req.query.team);
  if (req.query.bdoCode) filter.bdoCode = String(req.query.bdoCode);
  if (req.query.status) filter.status = String(req.query.status);
  if (req.query.countryId) filter.countryId = parseObjectId(String(req.query.countryId), 'countryId');
  if (req.query.stateId) filter.stateId = parseObjectId(String(req.query.stateId), 'stateId');
  if (req.query.cityId) filter.cityId = parseObjectId(String(req.query.cityId), 'cityId');
  if (req.query.branchId) filter.branchId = parseObjectId(String(req.query.branchId), 'branchId');
  if (req.query.from || req.query.to) {
    const createdAt: Record<string, Date> = {};
    if (req.query.from) createdAt.$gte = new Date(String(req.query.from));
    if (req.query.to) {
      const to = new Date(String(req.query.to));
      if (!String(req.query.to).includes('T')) {
        to.setHours(23, 59, 59, 999);
      }
      createdAt.$lte = to;
    }
    filter.createdAt = createdAt;
  }

  const andClauses: Record<string, unknown>[] = [];

  if (req.query.salesManagerId) {
    const salesManagerId = parseObjectId(String(req.query.salesManagerId), 'salesManagerId');
    const reportees = await EmployeeModel.find({
      tenantId,
      status: 'ACTIVE',
      $or: [{ managerId: salesManagerId }, { supervisorId: salesManagerId }],
    })
      .select('_id')
      .lean()
      .exec();
    const teamIds = [salesManagerId, ...reportees.map((row) => row._id)];
    andClauses.push({ assignedEmployeeId: { $in: teamIds } });
  }

  if (req.query.regionalLeadId) {
    const regionalLeadId = parseObjectId(String(req.query.regionalLeadId), 'regionalLeadId');
    const regional = await EmployeeModel.findOne({ _id: regionalLeadId, tenantId }).lean().exec();
    const regionalName = regional ? `${regional.firstName} ${regional.lastName}`.trim() : '';
    andClauses.push({
      $or: [
        { assignedEmployeeId: regionalLeadId },
        ...(regionalName ? [{ rsm: regionalName }] : []),
      ],
    });
  }

  if (andClauses.length > 0) {
    filter.$and = andClauses;
  }

  const [leads, branches, cities, states, employees] = await Promise.all([
    LeadModel.find(filter).lean().exec(),
    BranchModel.find({ tenantId }).lean().exec(),
    CityModel.find({ tenantId }).lean().exec(),
    StateModel.find({ tenantId }).lean().exec(),
    EmployeeModel.find({
      tenantId,
      status: 'ACTIVE',
      orgRole: { $in: ['REGIONAL_HEAD', 'SALES_MANAGER'] },
    })
      .lean()
      .exec(),
  ]);

  const total = leads.length;
  const called = leads.filter((row) => row.called || CALLED_STATUSES.includes(row.status as never)).length;
  const connected = leads.filter(
    (row) => row.connected || CONNECTED_STATUSES.includes(row.status as never),
  ).length;

  const byCampaign = new Map<
    string,
    { campaignName: string; leads: number; called: number; connected: number; statuses: Record<string, number> }
  >();
  const byLocation = new Map<
    string,
    { location: string; leads: number; statuses: Record<string, number> }
  >();
  const statusTotals: Record<string, number> = {};
  const hourly = Array.from({ length: 24 }, (_, hour) => ({ hour, called: 0 }));
  const branchNameMap = new Map(branches.map((row) => [String(row._id), row.name || row.code || '']));
  const cityNameMap = new Map(cities.map((row) => [String(row._id), row.name || '']));
  const branchCityMap = new Map(branches.map((row) => [String(row._id), String(row.cityId)]));

  for (const lead of leads) {
    const campaign = String(lead.campaignName || lead.source || 'Unassigned');
    const branchName = branchNameMap.get(String(lead.branchId)) || 'Unassigned';
    const cityName = cityNameMap.get(branchCityMap.get(String(lead.branchId)) ?? '') || '';
    const location = cityName ? `${cityName} · ${branchName}` : branchName;
    const status = String(lead.status || 'NOT_CALLED');
    const isCalled = Boolean(lead.called || CALLED_STATUSES.includes(status as never));
    const isConnected = Boolean(lead.connected || CONNECTED_STATUSES.includes(status as never));

    statusTotals[status] = (statusTotals[status] ?? 0) + 1;

    const campaignRow = byCampaign.get(campaign) ?? {
      campaignName: campaign,
      leads: 0,
      called: 0,
      connected: 0,
      statuses: {},
    };
    campaignRow.leads += 1;
    if (isCalled) campaignRow.called += 1;
    if (isConnected) campaignRow.connected += 1;
    campaignRow.statuses[status] = (campaignRow.statuses[status] ?? 0) + 1;
    byCampaign.set(campaign, campaignRow);

    const locationRow = byLocation.get(location) ?? { location, statuses: {}, leads: 0 };
    locationRow.leads += 1;
    locationRow.statuses[status] = (locationRow.statuses[status] ?? 0) + 1;
    byLocation.set(location, locationRow);

    if (lead.calledAt) {
      const hour = new Date(lead.calledAt).getHours();
      hourly[hour].called += 1;
    }
  }

  const campaigns = [...byCampaign.values()]
    .map((row) => ({
      ...row,
      percentCalled: pct(row.called, row.leads),
      percentConnected: pct(row.connected, row.leads),
    }))
    .sort((a, b) => b.leads - a.leads);

  const locations = [...byLocation.values()].sort((a, b) => b.leads - a.leads);

  const outcome = Object.entries(statusTotals)
    .map(([status, count]) => ({
      status,
      label: LEAD_STATUS_LABELS[status] ?? status,
      count,
      percent: pct(count, total),
    }))
    .sort((a, b) => b.count - a.count);

  const recent = leads
    .slice()
    .sort((a, b) => {
      const aTime = a.calledAt ? new Date(a.calledAt).getTime() : 0;
      const bTime = b.calledAt ? new Date(b.calledAt).getTime() : 0;
      return bTime - aTime;
    })
    .slice(0, 25)
    .map((lead) => ({
      id: String(lead._id),
      name: lead.name,
      phone: lead.phone,
      campaignName: lead.campaignName || lead.source || '',
      called: Boolean(lead.called),
      connected: Boolean(lead.connected),
      status: lead.status,
      statusLabel: LEAD_STATUS_LABELS[String(lead.status)] ?? String(lead.status),
      team: lead.team || '',
      rsm: lead.rsm || '',
    }));

  const cityMap = new Map(cities.map((row) => [String(row._id), row]));
  const stateMap = new Map(states.map((row) => [String(row._id), row]));
  const branchMeta = new Map(
    branches.map((branch) => {
      const city = cityMap.get(String(branch.cityId));
      const state = city ? stateMap.get(String(city.stateId)) : undefined;
      return [
        String(branch._id),
        {
          branchId: String(branch._id),
          cityId: city ? String(city._id) : '',
          stateId: state ? String(state._id) : '',
          countryId: state ? String(state.countryId) : '',
        },
      ];
    }),
  );

  const people = employees.map((employee) => {
    const meta = branchMeta.get(String(employee.branchId)) ?? {
      branchId: String(employee.branchId ?? ''),
      cityId: '',
      stateId: '',
      countryId: '',
    };
    return {
      id: String(employee._id),
      name: `${employee.firstName} ${employee.lastName}`.trim(),
      orgRole: employee.orgRole,
      ...meta,
    };
  });

  const filters = {
    campaigns: [...new Set(leads.map((row) => String(row.campaignName || '')).filter(Boolean))].sort(),
    rsms: [...new Set(leads.map((row) => String(row.rsm || '')).filter(Boolean))].sort(),
    teams: [...new Set(leads.map((row) => String(row.team || '')).filter(Boolean))].sort(),
    bdoCodes: [...new Set(leads.map((row) => String(row.bdoCode || '')).filter(Boolean))].sort(),
    loanTypes: [...new Set(leads.map((row) => String(row.loanType || '')).filter(Boolean))].sort(),
    statuses: [...new Set(leads.map((row) => String(row.status || '')).filter(Boolean))].sort(),
    regionalLeads: people.filter((row) => row.orgRole === 'REGIONAL_HEAD'),
    salesManagers: people.filter((row) => row.orgRole === 'SALES_MANAGER'),
  };

  return {
    scope: access.scope,
    kpis: {
      leads: total,
      called,
      percentCalled: pct(called, total),
      connected,
      percentConnected: pct(connected, total),
    },
    campaigns,
    locations,
    // Backward-compatible alias while clients migrate from team/RSM split
    teams: locations.map((row) => ({
      team: row.location,
      leads: row.leads,
      statuses: row.statuses,
    })),
    outcome,
    hourly: hourly.filter((row) => row.hour >= 9 && row.hour <= 19),
    recent,
    filters,
  };
}
