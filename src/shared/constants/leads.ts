export const LEAD_STATUSES = [
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
  // legacy values kept for existing records
  'NEW',
  'CONTACTED',
  'FOLLOW_UP',
  'QUALIFIED',
  'WON',
  'LOST',
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LOAN_TYPES = ['PL', 'BL', 'CC', 'HL', 'GL', 'LAP', 'INS'] as const;
export type LoanType = (typeof LOAN_TYPES)[number];

export const ACCESS_SCOPES = ['ALL', 'STATE', 'CITY', 'BRANCH', 'TEAM', 'SELF'] as const;
export type AccessScope = (typeof ACCESS_SCOPES)[number];

/** Statuses that count as "called" (attempt made). */
export const CALLED_STATUSES: LeadStatus[] = [
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
  'CONTACTED',
  'FOLLOW_UP',
  'QUALIFIED',
  'WON',
  'LOST',
];

/** Statuses that count as "connected" (spoke with customer). */
export const CONNECTED_STATUSES: LeadStatus[] = [
  'CONTACTED_NOT_INTERESTED',
  'CONTACTED_FOLLOWUP',
  'CONTACTED_NOT_ELIGIBLE',
  'CONTACTED_INTERESTED',
  'LOGIN',
  'LOGIN_APPROVED',
  'LOGIN_REJECTED',
  'DISBURSED',
  'CONTACTED',
  'FOLLOW_UP',
  'QUALIFIED',
  'WON',
];

export const LEAD_STATUS_LABELS: Record<string, string> = {
  NOT_CALLED: 'NOT CALLED',
  CALLED_NOT_CONTACTED: 'Called-Not Contacted',
  CONTACTED_NOT_INTERESTED: 'Contacted-Not Interested',
  CONTACTED_FOLLOWUP: 'Contacted-Followup',
  CONTACTED_NOT_ELIGIBLE: 'Contacted-Not Eligible',
  CONTACTED_INTERESTED: 'Contacted-Interested',
  LOGIN: 'Login',
  LOGIN_APPROVED: 'Login Approved',
  LOGIN_REJECTED: 'Login Rejected',
  DISBURSED: 'Disbursed',
  RNR: 'RNR',
  NEW: 'NOT CALLED',
  CONTACTED: 'Contacted',
  FOLLOW_UP: 'Contacted-Followup',
  QUALIFIED: 'Contacted-Interested',
  WON: 'Disbursed',
  LOST: 'Contacted-Not Interested',
};

export const LOAN_TYPE_LABELS: Record<string, string> = {
  PL: 'Personal Loan',
  BL: 'Business Loan',
  CC: 'Credit Card',
  HL: 'Home Loan',
  GL: 'Gold Loan',
  LAP: 'Loan Against Property',
  INS: 'Insurance',
};
