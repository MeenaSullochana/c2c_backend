import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import {
  PERMISSIONS,
  ROLE_KEYS,
  TENANT_ADMIN_PERMISSIONS,
  TENANT_MEMBER_PERMISSIONS,
  TENANT_OWNER_PERMISSIONS,
} from './shared';
import { connectDb } from './db';
import { TenantModel, UserModel } from './models';
import {
  BranchModel,
  CityModel,
  CountryModel,
  DepartmentModel,
  DesignationModel,
  EmployeeModel,
  LeadFollowUpModel,
  LeadModel,
  LeaveRequestModel,
  LeaveTypeModel,
  HrmRoleModel,
  StateModel,
} from './models-business';

const DEMO_PASSWORD = 'Password123!';

async function main() {
  await connectDb();
  console.log('Connected to MongoDB database c2c');

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const acme = await TenantModel.findOneAndUpdate(
    { slug: 'acme-hr' },
    {
      $set: {
        name: 'MoneyZone',
        slug: 'acme-hr',
        status: 'ACTIVE',
        locale: 'en',
        brandName: 'MoneyZone',
        tagline: 'Financial Services',
        logoUrl: '/moneyzone-logo.png',
        supportEmail: 'hello@moneyzone.test',
        supportPhone: '+91 44 4000 1200',
        address: 'Chennai HQ',
      },
    },
    { upsert: true, new: true },
  );
  const nimbus = await TenantModel.findOneAndUpdate(
    { slug: 'nimbus-leads' },
    {
      $set: {
        name: 'MoneyZone Nimbus',
        slug: 'nimbus-leads',
        status: 'ACTIVE',
        locale: 'en',
        brandName: 'MoneyZone',
        tagline: 'Financial Services',
        logoUrl: '/moneyzone-logo.png',
        supportEmail: 'nimbus@moneyzone.test',
        supportPhone: '+91 80 4000 2200',
        address: 'Bengaluru Sales',
      },
    },
    { upsert: true, new: true },
  );

  const users = [
    {
      tenantId: acme._id,
      email: 'owner@acme.test',
      firstName: 'Asha',
      lastName: 'Iyer',
      roleKeys: [ROLE_KEYS.TENANT_OWNER],
      permissions: [...TENANT_OWNER_PERMISSIONS],
    },
    {
      tenantId: acme._id,
      email: 'admin@acme.test',
      firstName: 'Rahul',
      lastName: 'Menon',
      roleKeys: [ROLE_KEYS.TENANT_ADMIN],
      permissions: [...TENANT_ADMIN_PERMISSIONS],
    },
    {
      tenantId: acme._id,
      email: 'member@acme.test',
      firstName: 'Priya',
      lastName: 'Nair',
      roleKeys: [ROLE_KEYS.TENANT_MEMBER],
      permissions: [...TENANT_MEMBER_PERMISSIONS],
    },
    {
      tenantId: nimbus._id,
      email: 'owner@nimbus.test',
      firstName: 'Omar',
      lastName: 'Khan',
      roleKeys: [ROLE_KEYS.TENANT_OWNER],
      permissions: [...TENANT_OWNER_PERMISSIONS],
    },
    {
      tenantId: nimbus._id,
      email: 'sales@nimbus.test',
      firstName: 'Lina',
      lastName: 'George',
      roleKeys: [ROLE_KEYS.TENANT_ADMIN],
      permissions: [...TENANT_ADMIN_PERMISSIONS],
    },
  ];

  for (const user of users) {
    await UserModel.findOneAndUpdate(
      { tenantId: user.tenantId, email: user.email },
      { $set: { ...user, status: 'ACTIVE', locale: 'en', passwordHash } },
      { upsert: true, new: true },
    );
  }

  await seedWorkspace(acme._id, 'acme');
  await seedWorkspace(nimbus._id, 'nimbus');

  console.log('Seeded workspaces: acme-hr, nimbus-leads');
  console.log('Seeded locations, branches, employees, leave, and leads');
  console.log('Demo password for all seeded users: Password123!');
  console.log(
    'Logins: owner@acme.test, admin@acme.test, member@acme.test, owner@nimbus.test, sales@nimbus.test',
  );

  await mongoose.disconnect();
}

async function seedWorkspace(tenantId: mongoose.Types.ObjectId, prefix: string) {
  const india = await upsert(CountryModel, { tenantId, code: 'IN' }, { name: 'India', status: 'ACTIVE' });
  const tamilNadu = await upsert(
    StateModel,
    { tenantId, countryId: india._id, code: 'TN' },
    { name: 'Tamil Nadu', status: 'ACTIVE' },
  );
  const karnataka = await upsert(
    StateModel,
    { tenantId, countryId: india._id, code: 'KA' },
    { name: 'Karnataka', status: 'ACTIVE' },
  );
  const chennai = await upsert(
    CityModel,
    { tenantId, stateId: tamilNadu._id, name: 'Chennai' },
    { status: 'ACTIVE' },
  );
  const bengaluru = await upsert(
    CityModel,
    { tenantId, stateId: karnataka._id, name: 'Bengaluru' },
    { status: 'ACTIVE' },
  );

  const chennaiBranch = await upsert(
    BranchModel,
    { tenantId, code: 'CHN' },
    { cityId: chennai._id, name: 'Chennai HQ', address: 'Anna Salai', status: 'ACTIVE' },
  );
  const bengaluruBranch = await upsert(
    BranchModel,
    { tenantId, code: 'BLR' },
    { cityId: bengaluru._id, name: 'Bengaluru Sales', address: 'MG Road', status: 'ACTIVE' },
  );

  const sales = await upsert(DepartmentModel, { tenantId, code: 'SALES' }, { name: 'Sales' });
  const operations = await upsert(DepartmentModel, { tenantId, code: 'OPS' }, { name: 'Operations' });
  const hr = await upsert(DepartmentModel, { tenantId, code: 'HR' }, { name: 'Human Resources' });

  const branchManager = await upsert(DesignationModel, { tenantId, code: 'BM' }, { name: 'Branch Manager' });
  const supervisorRole = await upsert(DesignationModel, { tenantId, code: 'SUP' }, { name: 'Supervisor' });
  const executive = await upsert(DesignationModel, { tenantId, code: 'EXE' }, { name: 'Executive' });

  const managerRole = await upsert(
    HrmRoleModel,
    { tenantId, key: 'branch-manager' },
    {
      name: 'Branch Manager',
      minAge: 25,
      orgRole: 'MANAGER',
      description: 'Owns a branch P&L and staff',
      permissions: [
        PERMISSIONS.HRM_EMPLOYEE_VIEW,
        PERMISSIONS.HRM_LEAVE_MANAGE,
        PERMISSIONS.LEAD_VIEW,
        PERMISSIONS.LEAD_UPDATE,
        PERMISSIONS.BRANCH_VIEW,
      ],
    },
  );
  const supervisorHrmRole = await upsert(
    HrmRoleModel,
    { tenantId, key: 'supervisor' },
    {
      name: 'Supervisor',
      minAge: 21,
      orgRole: 'SUPERVISOR',
      description: 'Leads a desk of executives',
      permissions: [PERMISSIONS.HRM_EMPLOYEE_VIEW, PERMISSIONS.LEAD_VIEW, PERMISSIONS.LEAD_UPDATE, PERMISSIONS.LEAD_CREATE],
    },
  );
  const staffRole = await upsert(
    HrmRoleModel,
    { tenantId, key: 'staff' },
    {
      name: 'Staff',
      minAge: 18,
      orgRole: 'STAFF',
      description: 'Branch executive',
      permissions: [PERMISSIONS.LEAD_VIEW, PERMISSIONS.LEAD_CREATE, PERMISSIONS.HRM_LEAVE_VIEW],
    },
  );

  const casual = await upsert(LeaveTypeModel, { tenantId, name: 'Casual Leave' }, { daysAllowed: 12 });
  await upsert(LeaveTypeModel, { tenantId, name: 'Sick Leave' }, { daysAllowed: 8 });

  const chennaiManager = await upsert(
    EmployeeModel,
    { tenantId, employeeCode: `${prefix.toUpperCase()}-CHN-M1` },
    {
      firstName: 'Kavya',
      lastName: 'Raman',
      email: `${prefix}.chennai.manager@example.test`,
      phone: '9000000001',
      branchId: chennaiBranch._id,
      departmentId: operations._id,
      designationId: branchManager._id,
      orgRole: 'MANAGER',
      roleId: managerRole._id,
      dateOfBirth: new Date('1988-03-12'),
      joiningDate: new Date('2023-01-10'),
      status: 'ACTIVE',
    },
  );
  const chennaiSupervisor = await upsert(
    EmployeeModel,
    { tenantId, employeeCode: `${prefix.toUpperCase()}-CHN-S1` },
    {
      firstName: 'Arun',
      lastName: 'Krishna',
      email: `${prefix}.chennai.supervisor@example.test`,
      phone: '9000000002',
      branchId: chennaiBranch._id,
      departmentId: sales._id,
      designationId: supervisorRole._id,
      orgRole: 'SUPERVISOR',
      roleId: supervisorHrmRole._id,
      dateOfBirth: new Date('1994-07-21'),
      managerId: chennaiManager._id,
      joiningDate: new Date('2023-04-01'),
      status: 'ACTIVE',
    },
  );
  const chennaiStaff = await upsert(
    EmployeeModel,
    { tenantId, employeeCode: `${prefix.toUpperCase()}-CHN-E1` },
    {
      firstName: 'Meera',
      lastName: 'Das',
      email: `${prefix}.chennai.staff@example.test`,
      phone: '9000000003',
      branchId: chennaiBranch._id,
      departmentId: sales._id,
      designationId: executive._id,
      orgRole: 'STAFF',
      roleId: staffRole._id,
      dateOfBirth: new Date('1999-11-04'),
      managerId: chennaiManager._id,
      supervisorId: chennaiSupervisor._id,
      joiningDate: new Date('2024-02-12'),
      status: 'ACTIVE',
    },
  );

  const blrManager = await upsert(
    EmployeeModel,
    { tenantId, employeeCode: `${prefix.toUpperCase()}-BLR-M1` },
    {
      firstName: 'Nikhil',
      lastName: 'Rao',
      email: `${prefix}.blr.manager@example.test`,
      phone: '9000000004',
      branchId: bengaluruBranch._id,
      departmentId: hr._id,
      designationId: branchManager._id,
      orgRole: 'MANAGER',
      joiningDate: new Date('2022-11-05'),
      status: 'ACTIVE',
    },
  );
  const blrSupervisor = await upsert(
    EmployeeModel,
    { tenantId, employeeCode: `${prefix.toUpperCase()}-BLR-S1` },
    {
      firstName: 'Sana',
      lastName: 'Sheikh',
      email: `${prefix}.blr.supervisor@example.test`,
      phone: '9000000005',
      branchId: bengaluruBranch._id,
      departmentId: sales._id,
      designationId: supervisorRole._id,
      orgRole: 'SUPERVISOR',
      managerId: blrManager._id,
      joiningDate: new Date('2023-07-18'),
      status: 'ACTIVE',
    },
  );
  await upsert(
    EmployeeModel,
    { tenantId, employeeCode: `${prefix.toUpperCase()}-BLR-E1` },
    {
      firstName: 'Vikram',
      lastName: 'Patel',
      email: `${prefix}.blr.staff@example.test`,
      phone: '9000000006',
      branchId: bengaluruBranch._id,
      departmentId: sales._id,
      designationId: executive._id,
      orgRole: 'STAFF',
      managerId: blrManager._id,
      supervisorId: blrSupervisor._id,
      joiningDate: new Date('2024-06-01'),
      status: 'ACTIVE',
    },
  );

  await LeaveRequestModel.findOneAndUpdate(
    { tenantId, employeeId: chennaiStaff._id, reason: 'Family function' },
    {
      $setOnInsert: {
        leaveTypeId: casual._id,
        startDate: new Date('2026-08-25'),
        endDate: new Date('2026-08-26'),
        status: 'PENDING',
      },
    },
    { upsert: true, new: true },
  );

  const chennaiLead = await LeadModel.findOneAndUpdate(
    { tenantId, email: `${prefix}.lead.chennai@example.test` },
    {
      $set: {
        name: 'Ritika Sharma',
        phone: '9884100001',
        source: 'website',
        countryId: india._id,
        stateId: tamilNadu._id,
        cityId: chennai._id,
        branchId: chennaiBranch._id,
        assignedEmployeeId: chennaiStaff._id,
        status: 'FOLLOW_UP',
        notes: 'Asked for a demo next week',
        nextFollowUpAt: new Date('2026-08-22T10:00:00.000Z'),
        reminderAt: new Date('2026-08-22T10:00:00.000Z'),
        reminderDone: false,
      },
    },
    { upsert: true, new: true },
  );
  await LeadModel.findOneAndUpdate(
    { tenantId, email: `${prefix}.lead.blr@example.test` },
    {
      $set: {
        name: 'Joseph Mathew',
        phone: '9884100002',
        source: 'walk-in',
        countryId: india._id,
        stateId: karnataka._id,
        cityId: bengaluru._id,
        branchId: bengaluruBranch._id,
        assignedEmployeeId: blrSupervisor._id,
        status: 'NEW',
        notes: 'Interested in the HRM module',
      },
    },
    { upsert: true, new: true },
  );

  const owner = await UserModel.findOne({ tenantId }).sort({ createdAt: 1 }).exec();
  if (owner) {
    await LeadFollowUpModel.findOneAndUpdate(
      { tenantId, leadId: chennaiLead._id, note: 'Called and scheduled a product walkthrough' },
      {
        $setOnInsert: {
          nextFollowUpAt: new Date('2026-08-22'),
          statusAfter: 'FOLLOW_UP',
          createdBy: owner._id,
        },
      },
      { upsert: true, new: true },
    );
  }
}

async function upsert(
  model: {
    findOneAndUpdate: (
      filter: Record<string, unknown>,
      update: Record<string, unknown>,
      options: { upsert: boolean; new: boolean },
    ) => { exec: () => Promise<{ _id: mongoose.Types.ObjectId } | null> };
  },
  filter: Record<string, unknown>,
  set: Record<string, unknown>,
) {
  const doc = await model
    .findOneAndUpdate(filter, { $set: { ...filter, ...set } }, { upsert: true, new: true })
    .exec();
  if (!doc) {
    throw new Error('seed.upsert_failed');
  }
  return doc;
}

main().catch(async (error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
