export const ORG_ROLES = [
  'HEAD',
  'REGIONAL_HEAD',
  'LOCATION_HEAD',
  'BRANCH_HEAD',
  'SALES_MANAGER',
  'EXECUTIVE',
  'ACCOUNTS',
  'COORDINATOR_HEAD',
  'COORDINATOR',
  // legacy aliases
  'MANAGER',
  'SUPERVISOR',
  'STAFF',
] as const;

export type OrgRole = (typeof ORG_ROLES)[number];

export const ORG_ROLE_LABELS: Record<OrgRole, string> = {
  HEAD: 'Head (Admin)',
  REGIONAL_HEAD: 'Regional Head (State)',
  LOCATION_HEAD: 'Location Head (City)',
  BRANCH_HEAD: 'Branch Head',
  SALES_MANAGER: 'Sales Manager',
  EXECUTIVE: 'Executive',
  ACCOUNTS: 'Accounts',
  COORDINATOR_HEAD: 'Coordinator Head',
  COORDINATOR: 'Coordinator',
  MANAGER: 'Branch Head (legacy)',
  SUPERVISOR: 'Sales Manager (legacy)',
  STAFF: 'Executive (legacy)',
};

/** Maps org role → data access scope */
export const ORG_ROLE_SCOPE: Record<OrgRole, 'ALL' | 'STATE' | 'CITY' | 'BRANCH' | 'TEAM' | 'SELF'> = {
  HEAD: 'ALL',
  REGIONAL_HEAD: 'STATE',
  LOCATION_HEAD: 'CITY',
  BRANCH_HEAD: 'BRANCH',
  SALES_MANAGER: 'TEAM',
  EXECUTIVE: 'SELF',
  ACCOUNTS: 'BRANCH',
  COORDINATOR_HEAD: 'TEAM',
  COORDINATOR: 'SELF',
  MANAGER: 'BRANCH',
  SUPERVISOR: 'TEAM',
  STAFF: 'SELF',
};
