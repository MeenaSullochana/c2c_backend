import mongoose from 'mongoose';
import { PERMISSIONS, ROLE_KEYS } from './shared';
import { UserModel } from './models';
import {
  AttendanceModel,
  BranchModel,
  CityModel,
  CountryModel,
  DepartmentModel,
  DesignationModel,
  EmployeeModel,
  HrmRoleModel,
  LeadModel,
  LeaveRequestModel,
  LeaveTypeModel,
  PayslipModel,
  StateModel,
  WorkHistoryModel,
} from './models-business';

type Id = mongoose.Types.ObjectId;

async function upsert(
  model: {
    findOneAndUpdate: (
      filter: Record<string, unknown>,
      update: Record<string, unknown>,
      options: { upsert: boolean; new: boolean },
    ) => { exec: () => Promise<{ _id: Id } & Record<string, unknown> | null> };
  },
  filter: Record<string, unknown>,
  set: Record<string, unknown>,
) {
  const doc = await model
    .findOneAndUpdate(filter, { $set: { ...filter, ...set } }, { upsert: true, new: true })
    .exec();
  if (!doc) throw new Error('seed.upsert_failed');
  return doc;
}

const SALES_PERMS = [
  PERMISSIONS.TENANT_VIEW,
  PERMISSIONS.LEAD_VIEW,
  PERMISSIONS.LEAD_CREATE,
  PERMISSIONS.LEAD_UPDATE,
  PERMISSIONS.LEAD_IMPORT,
  PERMISSIONS.HRM_LEAVE_VIEW,
  PERMISSIONS.HRM_ATTENDANCE_VIEW,
  PERMISSIONS.BRANCH_VIEW,
];

const BRANCH_HEAD_PERMS = [
  ...SALES_PERMS,
  PERMISSIONS.HRM_EMPLOYEE_VIEW,
  PERMISSIONS.HRM_LEAVE_MANAGE,
  PERMISSIONS.HRM_ATTENDANCE_MANAGE,
  PERMISSIONS.LOCATION_VIEW,
];

function salaryFor(role: string) {
  const map: Record<string, { basicSalary: number; hra: number; allowances: number; deductions: number }> = {
    REGIONAL_HEAD: { basicSalary: 80000, hra: 20000, allowances: 10000, deductions: 8000 },
    LOCATION_HEAD: { basicSalary: 65000, hra: 16000, allowances: 8000, deductions: 6500 },
    BRANCH_HEAD: { basicSalary: 55000, hra: 14000, allowances: 7000, deductions: 5500 },
    SALES_MANAGER: { basicSalary: 40000, hra: 10000, allowances: 6000, deductions: 4000 },
    EXECUTIVE: { basicSalary: 25000, hra: 6000, allowances: 3000, deductions: 2000 },
    ACCOUNTS: { basicSalary: 30000, hra: 7500, allowances: 3500, deductions: 2500 },
    COORDINATOR_HEAD: { basicSalary: 28000, hra: 7000, allowances: 3000, deductions: 2200 },
    COORDINATOR: { basicSalary: 22000, hra: 5000, allowances: 2500, deductions: 1800 },
  };
  return map[role] ?? { basicSalary: 20000, hra: 4000, allowances: 2000, deductions: 1500 };
}

/** Extra geography + full branch teams for MoneyZone demo. */
export async function seedRichDemo(tenantId: Id, passwordHash: string) {
  const india = await upsert(CountryModel, { tenantId, code: 'IN' }, { name: 'India', status: 'ACTIVE' });

  const tn = await upsert(StateModel, { tenantId, countryId: india._id, code: 'TN' }, { name: 'Tamil Nadu', status: 'ACTIVE' });
  const ap = await upsert(StateModel, { tenantId, countryId: india._id, code: 'AP' }, { name: 'Andhra Pradesh', status: 'ACTIVE' });
  const kl = await upsert(StateModel, { tenantId, countryId: india._id, code: 'KL' }, { name: 'Kerala', status: 'ACTIVE' });
  const ka = await upsert(StateModel, { tenantId, countryId: india._id, code: 'KA' }, { name: 'Karnataka', status: 'ACTIVE' });

  const chennai = await upsert(CityModel, { tenantId, stateId: tn._id, name: 'Chennai' }, { status: 'ACTIVE' });
  const dindigul = await upsert(CityModel, { tenantId, stateId: tn._id, name: 'Dindigul' }, { status: 'ACTIVE' });
  const coimbatore = await upsert(CityModel, { tenantId, stateId: tn._id, name: 'Coimbatore' }, { status: 'ACTIVE' });
  const vijayawada = await upsert(CityModel, { tenantId, stateId: ap._id, name: 'Vijayawada' }, { status: 'ACTIVE' });
  const kochi = await upsert(CityModel, { tenantId, stateId: kl._id, name: 'Kochi' }, { status: 'ACTIVE' });
  const bengaluru = await upsert(CityModel, { tenantId, stateId: ka._id, name: 'Bengaluru' }, { status: 'ACTIVE' });

  const branches = [
    { code: 'VDP', name: 'Vadapalani', city: chennai, address: 'Vadapalani Main Road' },
    { code: 'ASH', name: 'Ashok Nagar', city: chennai, address: '10th Avenue, Ashok Nagar' },
    { code: 'DGL', name: 'Dindigul Main', city: dindigul, address: 'Salai Road' },
    { code: 'CBE', name: 'Coimbatore Central', city: coimbatore, address: 'DB Road' },
    { code: 'VJA', name: 'Vijayawada Sales', city: vijayawada, address: 'MG Road' },
    { code: 'KOC', name: 'Kochi Branch', city: kochi, address: 'MG Road Ernakulam' },
    { code: 'BLR', name: 'Bengaluru Sales', city: bengaluru, address: 'MG Road' },
  ] as const;

  const branchDocs: Array<{
    code: string;
    name: string;
    branch: { _id: Id };
    city: { _id: Id };
    state: { _id: Id };
  }> = [];

  for (const item of branches) {
    const stateId =
      item.city._id === chennai._id || item.city._id === dindigul._id || item.city._id === coimbatore._id
        ? tn._id
        : item.city._id === vijayawada._id
          ? ap._id
          : item.city._id === kochi._id
            ? kl._id
            : ka._id;
    const branch = await upsert(
      BranchModel,
      { tenantId, code: item.code },
      { cityId: item.city._id, name: item.name, address: item.address, status: 'ACTIVE' },
    );
    branchDocs.push({ code: item.code, name: item.name, branch, city: item.city, state: { _id: stateId } });
  }

  const ops = await upsert(DepartmentModel, { tenantId, code: 'OPS' }, { name: 'Operations' });
  const sales = await upsert(DepartmentModel, { tenantId, code: 'SAL' }, { name: 'Sales' });
  const accountsDept = await upsert(DepartmentModel, { tenantId, code: 'ACC' }, { name: 'Accounts' });
  const coordDept = await upsert(DepartmentModel, { tenantId, code: 'CRD' }, { name: 'Coordination' });

  const desig = {
    rh: await upsert(DesignationModel, { tenantId, code: 'RH' }, { name: 'Regional Head' }),
    lh: await upsert(DesignationModel, { tenantId, code: 'LH' }, { name: 'Location Head' }),
    bh: await upsert(DesignationModel, { tenantId, code: 'BH' }, { name: 'Branch Head' }),
    sm: await upsert(DesignationModel, { tenantId, code: 'SM' }, { name: 'Sales Manager' }),
    exe: await upsert(DesignationModel, { tenantId, code: 'EXE' }, { name: 'Executive' }),
    acc: await upsert(DesignationModel, { tenantId, code: 'ACC' }, { name: 'Accounts Officer' }),
    ch: await upsert(DesignationModel, { tenantId, code: 'CH' }, { name: 'Coordinator Head' }),
    co: await upsert(DesignationModel, { tenantId, code: 'CO' }, { name: 'Coordinator' }),
  };

  const roleDocs = {
    regional: await upsert(HrmRoleModel, { tenantId, key: 'regional-head' }, {
      name: 'Regional Head', minAge: 28, orgRole: 'REGIONAL_HEAD', description: 'State head',
      permissions: BRANCH_HEAD_PERMS,
    }),
    location: await upsert(HrmRoleModel, { tenantId, key: 'location-head' }, {
      name: 'Location Head', minAge: 26, orgRole: 'LOCATION_HEAD', description: 'City head',
      permissions: BRANCH_HEAD_PERMS,
    }),
    branch: await upsert(HrmRoleModel, { tenantId, key: 'branch-manager' }, {
      name: 'Branch Head', minAge: 25, orgRole: 'BRANCH_HEAD', description: 'Branch head',
      permissions: BRANCH_HEAD_PERMS,
    }),
    sales: await upsert(HrmRoleModel, { tenantId, key: 'supervisor' }, {
      name: 'Sales Manager', minAge: 21, orgRole: 'SALES_MANAGER', description: 'Sales desk + lead import',
      permissions: SALES_PERMS,
    }),
    executive: await upsert(HrmRoleModel, { tenantId, key: 'staff' }, {
      name: 'Executive', minAge: 18, orgRole: 'EXECUTIVE', description: 'Calling executive',
      permissions: [PERMISSIONS.TENANT_VIEW, PERMISSIONS.LEAD_VIEW, PERMISSIONS.LEAD_CREATE, PERMISSIONS.LEAD_UPDATE, PERMISSIONS.HRM_LEAVE_VIEW, PERMISSIONS.HRM_ATTENDANCE_VIEW],
    }),
    accounts: await upsert(HrmRoleModel, { tenantId, key: 'accounts' }, {
      name: 'Accounts', minAge: 21, orgRole: 'ACCOUNTS', description: 'Branch accounts',
      permissions: [
        PERMISSIONS.TENANT_VIEW,
        PERMISSIONS.LEAD_VIEW,
        PERMISSIONS.HRM_EMPLOYEE_VIEW,
        PERMISSIONS.HRM_LEAVE_VIEW,
        PERMISSIONS.HRM_ATTENDANCE_VIEW,
        PERMISSIONS.BRANCH_VIEW,
      ],
    }),
    coordHead: await upsert(HrmRoleModel, { tenantId, key: 'coordinator-head' }, {
      name: 'Coordinator Head', minAge: 22, orgRole: 'COORDINATOR_HEAD', description: 'Coordinator lead',
      permissions: [PERMISSIONS.TENANT_VIEW, PERMISSIONS.LEAD_VIEW, PERMISSIONS.LEAD_UPDATE, PERMISSIONS.HRM_EMPLOYEE_VIEW],
    }),
    coord: await upsert(HrmRoleModel, { tenantId, key: 'coordinator' }, {
      name: 'Coordinator', minAge: 18, orgRole: 'COORDINATOR', description: 'Coordinator',
      permissions: [PERMISSIONS.TENANT_VIEW, PERMISSIONS.LEAD_VIEW, PERMISSIONS.LEAD_CREATE],
    }),
  };

  const casual = await upsert(LeaveTypeModel, { tenantId, name: 'Casual Leave' }, { daysAllowed: 12 });
  const sick = await upsert(LeaveTypeModel, { tenantId, name: 'Sick Leave' }, { daysAllowed: 8 });
  await upsert(LeaveTypeModel, { tenantId, name: 'Earned Leave' }, { daysAllowed: 15 });

  // Regional + location heads
  const tnRegional = await upsertEmp(tenantId, {
    code: 'MZ-TN-RH',
    firstName: 'Srinivasan',
    lastName: 'Iyer',
    email: 'tn.regional@moneyzone.test',
    phone: '9000001001',
    branchId: branchDocs[0].branch._id,
    departmentId: ops._id,
    designationId: desig.rh._id,
    orgRole: 'REGIONAL_HEAD',
    roleId: roleDocs.regional._id,
    scopeStateId: tn._id,
  });

  const chennaiLocation = await upsertEmp(tenantId, {
    code: 'MZ-CHN-LH',
    firstName: 'Lakshmi',
    lastName: 'Narayanan',
    email: 'chennai.location@moneyzone.test',
    phone: '9000001002',
    branchId: branchDocs[0].branch._id,
    departmentId: ops._id,
    designationId: desig.lh._id,
    orgRole: 'LOCATION_HEAD',
    roleId: roleDocs.location._id,
    scopeCityId: chennai._id,
    managerId: tnRegional._id,
  });

  const teams: Array<{
    branchCode: string;
    head: { _id: Id; firstName: string; lastName: string };
    sales: { _id: Id; firstName: string; lastName: string };
    executive: { _id: Id; firstName: string; lastName: string };
  }> = [];

  for (const [index, b] of branchDocs.entries()) {
    const n = index + 1;
    const head = await upsertEmp(tenantId, {
      code: `MZ-${b.code}-BH`,
      firstName: ['Kavya', 'Arun', 'Meena', 'Vikram', 'Priya', 'Joseph', 'Nikhil'][index] || `Head${n}`,
      lastName: b.name.replace(/\s+/g, ''),
      email: `${b.code.toLowerCase()}.head@moneyzone.test`,
      phone: `9000002${String(n).padStart(3, '0')}`,
      branchId: b.branch._id,
      departmentId: ops._id,
      designationId: desig.bh._id,
      orgRole: 'BRANCH_HEAD',
      roleId: roleDocs.branch._id,
      managerId: b.city._id === chennai._id ? chennaiLocation._id : tnRegional._id,
    });

    const salesMgr = await upsertEmp(tenantId, {
      code: `MZ-${b.code}-SM`,
      firstName: ['Ram', 'Sana', 'Dev', 'Anu', 'Hari', 'Rita', 'Omar'][index] || `Sales${n}`,
      lastName: 'Manager',
      email: `${b.code.toLowerCase()}.sales@moneyzone.test`,
      phone: `9000003${String(n).padStart(3, '0')}`,
      branchId: b.branch._id,
      departmentId: sales._id,
      designationId: desig.sm._id,
      orgRole: 'SALES_MANAGER',
      roleId: roleDocs.sales._id,
      managerId: head._id,
    });

    const executive = await upsertEmp(tenantId, {
      code: `MZ-${b.code}-E1`,
      firstName: ['Karthik', 'Meera', 'Ajay', 'Divya', 'Suresh', 'Neha', 'Rahul'][index] || `Exe${n}`,
      lastName: 'Exec',
      email: `${b.code.toLowerCase()}.exec@moneyzone.test`,
      phone: `9000004${String(n).padStart(3, '0')}`,
      branchId: b.branch._id,
      departmentId: sales._id,
      designationId: desig.exe._id,
      orgRole: 'EXECUTIVE',
      roleId: roleDocs.executive._id,
      managerId: head._id,
      supervisorId: salesMgr._id,
    });

    await upsertEmp(tenantId, {
      code: `MZ-${b.code}-E2`,
      firstName: ['Kumar', 'Asha', 'Bala', 'Geetha', 'Mani', 'Fathima', 'John'][index] || `Exe2${n}`,
      lastName: 'Staff',
      email: `${b.code.toLowerCase()}.exec2@moneyzone.test`,
      phone: `9000005${String(n).padStart(3, '0')}`,
      branchId: b.branch._id,
      departmentId: sales._id,
      designationId: desig.exe._id,
      orgRole: 'EXECUTIVE',
      roleId: roleDocs.executive._id,
      managerId: head._id,
      supervisorId: salesMgr._id,
    });

    await upsertEmp(tenantId, {
      code: `MZ-${b.code}-ACC`,
      firstName: ['Accounts', 'Finance', 'Ledger', 'Cash', 'Audit', 'Books', 'Pay'][index] || `Acc${n}`,
      lastName: b.code,
      email: `${b.code.toLowerCase()}.accounts@moneyzone.test`,
      phone: `9000006${String(n).padStart(3, '0')}`,
      branchId: b.branch._id,
      departmentId: accountsDept._id,
      designationId: desig.acc._id,
      orgRole: 'ACCOUNTS',
      roleId: roleDocs.accounts._id,
      managerId: head._id,
    });

    const coordHead = await upsertEmp(tenantId, {
      code: `MZ-${b.code}-CH`,
      firstName: ['Coord', 'Desk', 'Hub', 'Link', 'Node', 'Gate', 'Post'][index] || `CH${n}`,
      lastName: 'Head',
      email: `${b.code.toLowerCase()}.coordhead@moneyzone.test`,
      phone: `9000007${String(n).padStart(3, '0')}`,
      branchId: b.branch._id,
      departmentId: coordDept._id,
      designationId: desig.ch._id,
      orgRole: 'COORDINATOR_HEAD',
      roleId: roleDocs.coordHead._id,
      managerId: head._id,
    });

    await upsertEmp(tenantId, {
      code: `MZ-${b.code}-CO`,
      firstName: ['Coordinator', 'Helper', 'Assist', 'Support', 'Desk', 'Clerk', 'Aide'][index] || `CO${n}`,
      lastName: b.code,
      email: `${b.code.toLowerCase()}.coord@moneyzone.test`,
      phone: `9000008${String(n).padStart(3, '0')}`,
      branchId: b.branch._id,
      departmentId: coordDept._id,
      designationId: desig.co._id,
      orgRole: 'COORDINATOR',
      roleId: roleDocs.coord._id,
      managerId: head._id,
      supervisorId: coordHead._id,
    });

    teams.push({
      branchCode: b.code,
      head: { _id: head._id, firstName: head.firstName as string, lastName: head.lastName as string },
      sales: { _id: salesMgr._id, firstName: salesMgr.firstName as string, lastName: salesMgr.lastName as string },
      executive: { _id: executive._id, firstName: executive.firstName as string, lastName: executive.lastName as string },
    });
  }

  // Leads, leaves, attendance, payslips per branch team
  const campaignNames = ['XSELLQ2227', 'XSELLQ2LOT2', 'TOP60', 'SAPL', 'FreshdataXsellQ1'];
  const statuses = [
    'NOT_CALLED',
    'CALLED_NOT_CONTACTED',
    'CONTACTED_NOT_INTERESTED',
    'CONTACTED_FOLLOWUP',
    'CONTACTED_INTERESTED',
    'LOGIN',
    'DISBURSED',
  ] as const;

  for (const [bi, b] of branchDocs.entries()) {
    const team = teams[bi];
    for (let i = 0; i < 8; i++) {
      const status = statuses[i % statuses.length];
      const called = status !== 'NOT_CALLED';
      const connected = !['NOT_CALLED', 'CALLED_NOT_CONTACTED'].includes(status);
      await LeadModel.findOneAndUpdate(
        { tenantId, email: `lead.${b.code.toLowerCase()}.${i + 1}@demo.test` },
        {
          $set: {
            name: `Customer ${b.code} ${i + 1}`,
            phone: `9884${b.code.slice(0, 2)}${1000 + i}`,
            source: 'seed',
            campaignName: campaignNames[i % campaignNames.length],
            loanType: i % 2 === 0 ? 'PL' : 'BL',
            rsm: `${team.head.firstName} ${team.head.lastName}`,
            team: `${b.name} X-Sell`,
            bdoCode: `${b.code}0${(i % 3) + 1}`,
            countryId: india._id,
            stateId: b.state._id,
            cityId: b.city._id,
            branchId: b.branch._id,
            assignedEmployeeId: team.executive._id,
            status,
            called,
            connected,
            calledAt: called ? new Date(`2026-09-${10 + (i % 8)}T${10 + (i % 8)}:15:00.000Z`) : undefined,
            notes: 'Demo seeded lead',
          },
        },
        { upsert: true, new: true },
      );
    }

    await LeaveRequestModel.findOneAndUpdate(
      { tenantId, employeeId: team.executive._id, reason: `${b.code} family function` },
      {
        $set: {
          leaveTypeId: casual._id,
          startDate: new Date('2026-09-25'),
          endDate: new Date('2026-09-26'),
          status: bi % 2 === 0 ? 'PENDING' : 'APPROVED',
        },
      },
      { upsert: true, new: true },
    );

    await LeaveRequestModel.findOneAndUpdate(
      { tenantId, employeeId: team.sales._id, reason: `${b.code} medical` },
      {
        $set: {
          leaveTypeId: sick._id,
          startDate: new Date('2026-09-12'),
          endDate: new Date('2026-09-12'),
          status: 'APPROVED',
        },
      },
      { upsert: true, new: true },
    );

    for (const day of ['2026-09-16', '2026-09-17', '2026-09-18']) {
      await AttendanceModel.findOneAndUpdate(
        { tenantId, employeeId: team.executive._id, dateKey: day },
        {
          $set: {
            clockInAt: new Date(`${day}T04:30:00.000Z`),
            clockOutAt: new Date(`${day}T13:00:00.000Z`),
          },
        },
        { upsert: true, new: true },
      );
    }

    const branchStaff = await EmployeeModel.find({
      tenantId,
      branchId: b.branch._id,
      status: 'ACTIVE',
    })
      .select('_id basicSalary hra allowances deductions orgRole designationId')
      .lean()
      .exec();

    for (const emp of branchStaff) {
      const basic = emp.basicSalary || 25000;
      const hra = emp.hra || 6000;
      const allowances = emp.allowances || 3000;
      const deductions = emp.deductions || 2000;
      const netPay = basic + hra + allowances - deductions;
      await PayslipModel.findOneAndUpdate(
        { tenantId, employeeId: emp._id, periodKey: '2026-08' },
        {
          $set: {
            basicSalary: basic,
            hra,
            allowances,
            deductions,
            netPay,
            status: 'PAID',
            paidAt: new Date('2026-09-01'),
          },
        },
        { upsert: true, new: true },
      );
      await PayslipModel.findOneAndUpdate(
        { tenantId, employeeId: emp._id, periodKey: '2026-09' },
        {
          $set: {
            basicSalary: basic,
            hra,
            allowances,
            deductions,
            netPay,
            status: 'DRAFT',
          },
        },
        { upsert: true, new: true },
      );

      await WorkHistoryModel.findOneAndUpdate(
        { tenantId, employeeId: emp._id, eventType: 'JOINED', title: 'Joined organization' },
        {
          $set: {
            detail: 'Onboarded into MoneyZone',
            fromDate: new Date('2024-01-15'),
            branchId: b.branch._id,
            orgRole: emp.orgRole || 'EXECUTIVE',
            designationId: emp.designationId,
          },
        },
        { upsert: true, new: true },
      );
      await WorkHistoryModel.findOneAndUpdate(
        { tenantId, employeeId: emp._id, eventType: 'ROLE_CHANGE', title: 'Current role assignment' },
        {
          $set: {
            detail: `Assigned at ${b.name}`,
            fromDate: new Date('2025-04-01'),
            branchId: b.branch._id,
            orgRole: emp.orgRole || 'EXECUTIVE',
            designationId: emp.designationId,
          },
        },
        { upsert: true, new: true },
      );
      await WorkHistoryModel.findOneAndUpdate(
        { tenantId, employeeId: emp._id, eventType: 'SALARY_REVISION', title: 'Salary revision FY26' },
        {
          $set: {
            detail: `Net pay revised to ₹${netPay.toLocaleString('en-IN')}`,
            fromDate: new Date('2026-04-01'),
            branchId: b.branch._id,
            orgRole: emp.orgRole || '',
            designationId: emp.designationId,
          },
        },
        { upsert: true, new: true },
      );
    }
  }

  const accountsPerms = [
    PERMISSIONS.TENANT_VIEW,
    PERMISSIONS.LEAD_VIEW,
    PERMISSIONS.HRM_EMPLOYEE_VIEW,
    PERMISSIONS.HRM_LEAVE_VIEW,
    PERMISSIONS.HRM_ATTENDANCE_VIEW,
    PERMISSIONS.BRANCH_VIEW,
  ];
  const execPerms = [
    PERMISSIONS.TENANT_VIEW,
    PERMISSIONS.LEAD_VIEW,
    PERMISSIONS.LEAD_CREATE,
    PERMISSIONS.LEAD_UPDATE,
    PERMISSIONS.HRM_LEAVE_VIEW,
    PERMISSIONS.HRM_ATTENDANCE_VIEW,
  ];

  type LoginUser = {
    email: string;
    firstName: string;
    lastName: string;
    employeeId: Id;
    accessScope: string;
    permissions: string[];
  };

  const loginUsers: LoginUser[] = [
    {
      email: 'tn.regional@acme.test',
      firstName: 'Srinivasan',
      lastName: 'Iyer',
      employeeId: tnRegional._id,
      accessScope: 'STATE',
      permissions: BRANCH_HEAD_PERMS,
    },
    {
      email: 'chennai.location@acme.test',
      firstName: 'Lakshmi',
      lastName: 'Narayanan',
      employeeId: chennaiLocation._id,
      accessScope: 'CITY',
      permissions: BRANCH_HEAD_PERMS,
    },
  ];

  for (const [bi, b] of branchDocs.entries()) {
    const team = teams[bi];
    const code = b.code.toLowerCase();
    loginUsers.push(
      {
        email: `${code}.head@acme.test`,
        firstName: String(team.head.firstName),
        lastName: String(team.head.lastName),
        employeeId: team.head._id,
        accessScope: 'BRANCH',
        permissions: BRANCH_HEAD_PERMS,
      },
      {
        email: `${code}.sales@acme.test`,
        firstName: String(team.sales.firstName),
        lastName: String(team.sales.lastName),
        employeeId: team.sales._id,
        accessScope: 'TEAM',
        permissions: SALES_PERMS,
      },
      {
        email: `${code}.exec@acme.test`,
        firstName: String(team.executive.firstName),
        lastName: String(team.executive.lastName),
        employeeId: team.executive._id,
        accessScope: 'SELF',
        permissions: execPerms,
      },
    );

    const accountsEmp = await EmployeeModel.findOne({
      tenantId,
      employeeCode: `MZ-${b.code}-ACC`,
    }).exec();
    if (accountsEmp) {
      loginUsers.push({
        email: `${code}.accounts@acme.test`,
        firstName: String(accountsEmp.firstName),
        lastName: String(accountsEmp.lastName),
        employeeId: accountsEmp._id,
        accessScope: 'BRANCH',
        permissions: accountsPerms,
      });
    }

    // Friendly aliases for Vadapalani (primary demo branch)
    if (b.code === 'VDP') {
      loginUsers.push(
        {
          email: 'vadapalani.head@acme.test',
          firstName: String(team.head.firstName),
          lastName: String(team.head.lastName),
          employeeId: team.head._id,
          accessScope: 'BRANCH',
          permissions: BRANCH_HEAD_PERMS,
        },
        {
          email: 'vadapalani.sales@acme.test',
          firstName: String(team.sales.firstName),
          lastName: String(team.sales.lastName),
          employeeId: team.sales._id,
          accessScope: 'TEAM',
          permissions: SALES_PERMS,
        },
        {
          email: 'vadapalani.exec@acme.test',
          firstName: String(team.executive.firstName),
          lastName: String(team.executive.lastName),
          employeeId: team.executive._id,
          accessScope: 'SELF',
          permissions: execPerms,
        },
      );
      if (accountsEmp) {
        loginUsers.push({
          email: 'vadapalani.accounts@acme.test',
          firstName: String(accountsEmp.firstName),
          lastName: String(accountsEmp.lastName),
          employeeId: accountsEmp._id,
          accessScope: 'BRANCH',
          permissions: accountsPerms,
        });
      }
    }
  }

  for (const u of loginUsers) {
    await UserModel.findOneAndUpdate(
      { tenantId, email: u.email },
      {
        $set: {
          firstName: u.firstName,
          lastName: u.lastName,
          roleKeys: [ROLE_KEYS.TENANT_MEMBER],
          permissions: u.permissions,
          accessScope: u.accessScope,
          employeeId: u.employeeId,
          status: 'ACTIVE',
          locale: 'en',
          passwordHash,
        },
      },
      { upsert: true, new: true },
    );
  }

  return {
    branches: branchDocs.length,
    teams: teams.length,
    logins: loginUsers.length,
  };
}

async function upsertEmp(
  tenantId: Id,
  input: {
    code: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    branchId: Id;
    departmentId: Id;
    designationId: Id;
    orgRole: string;
    roleId?: Id;
    managerId?: Id;
    supervisorId?: Id;
    scopeStateId?: Id;
    scopeCityId?: Id;
  },
) {
  const pay = salaryFor(input.orgRole);
  const today = new Date();
  const birthdayToday = new Date(1990, today.getMonth(), today.getDate());
  return upsert(
    EmployeeModel,
    { tenantId, employeeCode: input.code },
    {
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone,
      branchId: input.branchId,
      departmentId: input.departmentId,
      designationId: input.designationId,
      orgRole: input.orgRole,
      roleId: input.roleId,
      managerId: input.managerId,
      supervisorId: input.supervisorId,
      scopeStateId: input.scopeStateId,
      scopeCityId: input.scopeCityId,
      joiningDate: new Date('2024-01-15'),
      dateOfBirth: input.code.endsWith('-E1') || input.code.endsWith('-RH') ? birthdayToday : new Date('1992-06-01'),
      photoUrl: '',
      workFromHome: input.orgRole === 'EXECUTIVE' || input.orgRole === 'COORDINATOR',
      status: 'ACTIVE',
      ...pay,
    },
  );
}
