import mongoose, { Schema, type InferSchemaType, type Model } from 'mongoose';

const tenantRef = { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true };

const countrySchema = new Schema(
  {
    tenantId: tenantRef,
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    status: { type: String, required: true, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  },
  { timestamps: true, collection: 'countries' },
);
countrySchema.index({ tenantId: 1, code: 1 }, { unique: true });

const stateSchema = new Schema(
  {
    tenantId: tenantRef,
    countryId: { type: Schema.Types.ObjectId, ref: 'Country', required: true, index: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    status: { type: String, required: true, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  },
  { timestamps: true, collection: 'states' },
);
stateSchema.index({ tenantId: 1, countryId: 1, code: 1 }, { unique: true });

const citySchema = new Schema(
  {
    tenantId: tenantRef,
    stateId: { type: Schema.Types.ObjectId, ref: 'State', required: true, index: true },
    name: { type: String, required: true, trim: true },
    status: { type: String, required: true, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  },
  { timestamps: true, collection: 'cities' },
);
citySchema.index({ tenantId: 1, stateId: 1, name: 1 }, { unique: true });

const branchSchema = new Schema(
  {
    tenantId: tenantRef,
    cityId: { type: Schema.Types.ObjectId, ref: 'City', required: true, index: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    address: { type: String, trim: true, default: '' },
    status: { type: String, required: true, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  },
  { timestamps: true, collection: 'branches' },
);
branchSchema.index({ tenantId: 1, code: 1 }, { unique: true });

const departmentSchema = new Schema(
  {
    tenantId: tenantRef,
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, uppercase: true, trim: true },
  },
  { timestamps: true, collection: 'departments' },
);
departmentSchema.index({ tenantId: 1, code: 1 }, { unique: true });

const designationSchema = new Schema(
  {
    tenantId: tenantRef,
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, uppercase: true, trim: true },
  },
  { timestamps: true, collection: 'designations' },
);
designationSchema.index({ tenantId: 1, code: 1 }, { unique: true });

const hrmRoleSchema = new Schema(
  {
    tenantId: tenantRef,
    name: { type: String, required: true, trim: true },
    key: { type: String, required: true, lowercase: true, trim: true },
    description: { type: String, trim: true, default: '' },
    minAge: { type: Number, required: true, min: 16, max: 80, default: 18 },
    orgRole: {
      type: String,
      required: true,
      enum: [
        'HEAD',
        'REGIONAL_HEAD',
        'LOCATION_HEAD',
        'BRANCH_HEAD',
        'SALES_MANAGER',
        'EXECUTIVE',
        'ACCOUNTS',
        'COORDINATOR_HEAD',
        'COORDINATOR',
        'MANAGER',
        'SUPERVISOR',
        'STAFF',
      ],
    },
    permissions: { type: [String], required: true, default: [] },
  },
  { timestamps: true, collection: 'hrm_roles' },
);
hrmRoleSchema.index({ tenantId: 1, key: 1 }, { unique: true });

const employeeSchema = new Schema(
  {
    tenantId: tenantRef,
    employeeCode: { type: String, required: true, uppercase: true, trim: true },
    photoUrl: { type: String, trim: true, default: '' },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, trim: true, default: '' },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
    designationId: { type: Schema.Types.ObjectId, ref: 'Designation', required: true },
    orgRole: {
      type: String,
      required: true,
      enum: [
        'HEAD',
        'REGIONAL_HEAD',
        'LOCATION_HEAD',
        'BRANCH_HEAD',
        'SALES_MANAGER',
        'EXECUTIVE',
        'ACCOUNTS',
        'COORDINATOR_HEAD',
        'COORDINATOR',
        'MANAGER',
        'SUPERVISOR',
        'STAFF',
      ],
    },
    /** Optional explicit scope overrides for regional/location heads */
    scopeStateId: { type: Schema.Types.ObjectId, ref: 'State' },
    scopeCityId: { type: Schema.Types.ObjectId, ref: 'City' },
    managerId: { type: Schema.Types.ObjectId, ref: 'Employee' },
    supervisorId: { type: Schema.Types.ObjectId, ref: 'Employee' },
    joiningDate: { type: Date, required: true },
    dateOfBirth: { type: Date },
    gender: { type: String, trim: true, default: '' },
    address: { type: String, trim: true, default: '' },
    roleId: { type: Schema.Types.ObjectId, ref: 'HrmRole' },
    basicSalary: { type: Number, default: 0 },
    hra: { type: Number, default: 0 },
    allowances: { type: Number, default: 0 },
    deductions: { type: Number, default: 0 },
    workFromHome: { type: Boolean, default: false },
    status: { type: String, required: true, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  },
  { timestamps: true, collection: 'employees' },
);
employeeSchema.index({ tenantId: 1, employeeCode: 1 }, { unique: true });
employeeSchema.index({ tenantId: 1, email: 1 }, { unique: true });

const leaveTypeSchema = new Schema(
  {
    tenantId: tenantRef,
    name: { type: String, required: true, trim: true },
    daysAllowed: { type: Number, required: true, min: 1 },
  },
  { timestamps: true, collection: 'leave_types' },
);
leaveTypeSchema.index({ tenantId: 1, name: 1 }, { unique: true });

const leaveRequestSchema = new Schema(
  {
    tenantId: tenantRef,
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
    leaveTypeId: { type: Schema.Types.ObjectId, ref: 'LeaveType', required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    reason: { type: String, required: true, trim: true },
    status: {
      type: String,
      required: true,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
    },
    decidedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    decidedAt: { type: Date },
  },
  { timestamps: true, collection: 'leave_requests' },
);

const attendanceSchema = new Schema(
  {
    tenantId: tenantRef,
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
    dateKey: { type: String, required: true },
    clockInAt: { type: Date, required: true },
    clockOutAt: { type: Date },
  },
  { timestamps: true, collection: 'attendance_records' },
);
attendanceSchema.index({ tenantId: 1, employeeId: 1, dateKey: 1 }, { unique: true });

const leadSchema = new Schema(
  {
    tenantId: tenantRef,
    name: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    source: { type: String, trim: true, default: 'manual' },
    campaignName: { type: String, trim: true, default: '', index: true },
    loanType: {
      type: String,
      enum: ['PL', 'BL', 'CC', 'HL', 'GL', 'LAP', 'INS', ''],
      default: 'PL',
    },
    loanAmount: { type: Number, default: 0 },
    bankId: { type: Schema.Types.ObjectId, ref: 'Bank' },
    rsm: { type: String, trim: true, default: '' },
    team: { type: String, trim: true, default: '' },
    bdoCode: { type: String, trim: true, default: '' },
    called: { type: Boolean, default: false },
    connected: { type: Boolean, default: false },
    calledAt: { type: Date },
    countryId: { type: Schema.Types.ObjectId, ref: 'Country', required: true, index: true },
    stateId: { type: Schema.Types.ObjectId, ref: 'State', required: true, index: true },
    cityId: { type: Schema.Types.ObjectId, ref: 'City', required: true, index: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch', required: true, index: true },
    assignedEmployeeId: { type: Schema.Types.ObjectId, ref: 'Employee' },
    status: {
      type: String,
      required: true,
      enum: [
        'NOT_CALLED',
        'CALLED_NOT_CONTACTED',
        'CONTACTED_NOT_INTERESTED',
        'CONTACTED_FOLLOWUP',
        'CONTACTED_NOT_ELIGIBLE',
        'CONTACTED_INTERESTED',
        'LOGIN',
        'LOGIN_APPROVED',
        'LOGIN_REJECTED',
        'DISBURSED',
        'RNR',
        'NEW',
        'CONTACTED',
        'FOLLOW_UP',
        'QUALIFIED',
        'WON',
        'LOST',
      ],
      default: 'NOT_CALLED',
    },
    loginRemarks: { type: String, trim: true, default: '' },
    notes: { type: String, trim: true, default: '' },
    nextFollowUpAt: { type: Date },
    reminderAt: { type: Date },
    reminderDone: { type: Boolean, default: false },
    importBatchId: { type: String, trim: true, default: '' },
  },
  { timestamps: true, collection: 'leads' },
);
leadSchema.index({ tenantId: 1, campaignName: 1 });
leadSchema.index({ tenantId: 1, email: 1, phone: 1 });

const leadFollowUpSchema = new Schema(
  {
    tenantId: tenantRef,
    leadId: { type: Schema.Types.ObjectId, ref: 'Lead', required: true, index: true },
    note: { type: String, required: true, trim: true },
    nextFollowUpAt: { type: Date },
    reminderAt: { type: Date },
    statusAfter: { type: String, trim: true, default: '' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true, collection: 'lead_follow_ups' },
);

const payslipSchema = new Schema(
  {
    tenantId: tenantRef,
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
    periodKey: { type: String, required: true }, // YYYY-MM
    basicSalary: { type: Number, required: true, default: 0 },
    hra: { type: Number, required: true, default: 0 },
    allowances: { type: Number, required: true, default: 0 },
    deductions: { type: Number, required: true, default: 0 },
    netPay: { type: Number, required: true, default: 0 },
    status: { type: String, required: true, enum: ['DRAFT', 'PAID'], default: 'PAID' },
    paidAt: { type: Date },
  },
  { timestamps: true, collection: 'payslips' },
);
payslipSchema.index({ tenantId: 1, employeeId: 1, periodKey: 1 }, { unique: true });

const workHistorySchema = new Schema(
  {
    tenantId: tenantRef,
    employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
    eventType: {
      type: String,
      required: true,
      enum: ['JOINED', 'TRANSFER', 'PROMOTION', 'ROLE_CHANGE', 'SALARY_REVISION', 'STATUS_CHANGE', 'NOTE'],
    },
    title: { type: String, required: true, trim: true },
    detail: { type: String, trim: true, default: '' },
    fromDate: { type: Date, required: true },
    toDate: { type: Date },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch' },
    orgRole: { type: String, trim: true, default: '' },
    designationId: { type: Schema.Types.ObjectId, ref: 'Designation' },
  },
  { timestamps: true, collection: 'work_history' },
);
workHistorySchema.index({ tenantId: 1, employeeId: 1, fromDate: -1 });

const bankSchema = new Schema(
  {
    tenantId: tenantRef,
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    logoUrl: { type: String, trim: true, default: '' },
    status: { type: String, required: true, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  },
  { timestamps: true, collection: 'banks' },
);
bankSchema.index({ tenantId: 1, code: 1 }, { unique: true });

const enquirySchema = new Schema(
  {
    tenantId: tenantRef,
    name: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true, default: '' },
    phone: { type: String, required: true, trim: true },
    loanType: {
      type: String,
      enum: ['PL', 'BL', 'CC', 'HL', 'GL', 'LAP', 'INS', ''],
      default: 'PL',
    },
    loanAmount: { type: Number, default: 0 },
    bankId: { type: Schema.Types.ObjectId, ref: 'Bank' },
    message: { type: String, trim: true, default: '' },
    status: { type: String, enum: ['NEW', 'CONTACTED', 'CLOSED'], default: 'NEW' },
  },
  { timestamps: true, collection: 'enquiries' },
);

const announcementSchema = new Schema(
  {
    tenantId: tenantRef,
    title: { type: String, required: true, trim: true },
    body: { type: String, trim: true, default: '' },
    kind: {
      type: String,
      enum: ['WISHES', 'LEAVE', 'POSTER', 'BIRTHDAY', 'GENERAL'],
      default: 'GENERAL',
    },
    imageUrl: { type: String, trim: true, default: '' },
    scope: {
      type: String,
      enum: ['ALL', 'STATE', 'CITY', 'BRANCH'],
      default: 'ALL',
    },
    stateId: { type: Schema.Types.ObjectId, ref: 'State' },
    cityId: { type: Schema.Types.ObjectId, ref: 'City' },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch' },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, collection: 'announcements' },
);

export type CountryDoc = InferSchemaType<typeof countrySchema> & { _id: mongoose.Types.ObjectId };
export type StateDoc = InferSchemaType<typeof stateSchema> & { _id: mongoose.Types.ObjectId };
export type CityDoc = InferSchemaType<typeof citySchema> & { _id: mongoose.Types.ObjectId };
export type BranchDoc = InferSchemaType<typeof branchSchema> & { _id: mongoose.Types.ObjectId };
export type DepartmentDoc = InferSchemaType<typeof departmentSchema> & { _id: mongoose.Types.ObjectId };
export type DesignationDoc = InferSchemaType<typeof designationSchema> & { _id: mongoose.Types.ObjectId };
export type HrmRoleDoc = InferSchemaType<typeof hrmRoleSchema> & { _id: mongoose.Types.ObjectId };
export type EmployeeDoc = InferSchemaType<typeof employeeSchema> & { _id: mongoose.Types.ObjectId };
export type LeaveTypeDoc = InferSchemaType<typeof leaveTypeSchema> & { _id: mongoose.Types.ObjectId };
export type LeaveRequestDoc = InferSchemaType<typeof leaveRequestSchema> & { _id: mongoose.Types.ObjectId };
export type AttendanceDoc = InferSchemaType<typeof attendanceSchema> & { _id: mongoose.Types.ObjectId };
export type LeadDoc = InferSchemaType<typeof leadSchema> & { _id: mongoose.Types.ObjectId };
export type LeadFollowUpDoc = InferSchemaType<typeof leadFollowUpSchema> & { _id: mongoose.Types.ObjectId };
export type PayslipDoc = InferSchemaType<typeof payslipSchema> & { _id: mongoose.Types.ObjectId };
export type WorkHistoryDoc = InferSchemaType<typeof workHistorySchema> & { _id: mongoose.Types.ObjectId };
export type BankDoc = InferSchemaType<typeof bankSchema> & { _id: mongoose.Types.ObjectId };
export type EnquiryDoc = InferSchemaType<typeof enquirySchema> & { _id: mongoose.Types.ObjectId };
export type AnnouncementDoc = InferSchemaType<typeof announcementSchema> & { _id: mongoose.Types.ObjectId };

export const CountryModel: Model<CountryDoc> =
  mongoose.models.Country ?? mongoose.model<CountryDoc>('Country', countrySchema);
export const StateModel: Model<StateDoc> =
  mongoose.models.State ?? mongoose.model<StateDoc>('State', stateSchema);
export const CityModel: Model<CityDoc> =
  mongoose.models.City ?? mongoose.model<CityDoc>('City', citySchema);
export const BranchModel: Model<BranchDoc> =
  mongoose.models.Branch ?? mongoose.model<BranchDoc>('Branch', branchSchema);
export const DepartmentModel: Model<DepartmentDoc> =
  mongoose.models.Department ?? mongoose.model<DepartmentDoc>('Department', departmentSchema);
export const DesignationModel: Model<DesignationDoc> =
  mongoose.models.Designation ?? mongoose.model<DesignationDoc>('Designation', designationSchema);
export const HrmRoleModel: Model<HrmRoleDoc> =
  mongoose.models.HrmRole ?? mongoose.model<HrmRoleDoc>('HrmRole', hrmRoleSchema);
export const EmployeeModel: Model<EmployeeDoc> =
  mongoose.models.Employee ?? mongoose.model<EmployeeDoc>('Employee', employeeSchema);
export const LeaveTypeModel: Model<LeaveTypeDoc> =
  mongoose.models.LeaveType ?? mongoose.model<LeaveTypeDoc>('LeaveType', leaveTypeSchema);
export const LeaveRequestModel: Model<LeaveRequestDoc> =
  mongoose.models.LeaveRequest ?? mongoose.model<LeaveRequestDoc>('LeaveRequest', leaveRequestSchema);
export const AttendanceModel: Model<AttendanceDoc> =
  mongoose.models.Attendance ?? mongoose.model<AttendanceDoc>('Attendance', attendanceSchema);
export const LeadModel: Model<LeadDoc> =
  mongoose.models.Lead ?? mongoose.model<LeadDoc>('Lead', leadSchema);
export const LeadFollowUpModel: Model<LeadFollowUpDoc> =
  mongoose.models.LeadFollowUp ?? mongoose.model<LeadFollowUpDoc>('LeadFollowUp', leadFollowUpSchema);
export const PayslipModel: Model<PayslipDoc> =
  mongoose.models.Payslip ?? mongoose.model<PayslipDoc>('Payslip', payslipSchema);
export const WorkHistoryModel: Model<WorkHistoryDoc> =
  mongoose.models.WorkHistory ?? mongoose.model<WorkHistoryDoc>('WorkHistory', workHistorySchema);
export const BankModel: Model<BankDoc> =
  mongoose.models.Bank ?? mongoose.model<BankDoc>('Bank', bankSchema);
export const EnquiryModel: Model<EnquiryDoc> =
  mongoose.models.Enquiry ?? mongoose.model<EnquiryDoc>('Enquiry', enquirySchema);
export const AnnouncementModel: Model<AnnouncementDoc> =
  mongoose.models.Announcement ?? mongoose.model<AnnouncementDoc>('Announcement', announcementSchema);
