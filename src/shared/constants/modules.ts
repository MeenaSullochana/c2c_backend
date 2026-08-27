export const MODULE_KEYS = {
  HRM: 'hrm',
  LEADS: 'leads',
  CRM: 'crm',
  PAYROLL: 'payroll',
  ATTENDANCE: 'attendance',
  RECRUITMENT: 'recruitment',
  PROJECTS: 'projects',
  INVENTORY: 'inventory',
  POS: 'pos',
  ACCOUNTING: 'accounting',
  HELPDESK: 'helpdesk',
  ASSETS: 'assets',
  DOCUMENTS: 'documents',
  CUSTOMERS: 'customers',
  WEBSITE_BUILDER: 'website_builder',
} as const;

export type ModuleKey = (typeof MODULE_KEYS)[keyof typeof MODULE_KEYS];
