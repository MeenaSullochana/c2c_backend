export const ROLE_KEYS = {
  TENANT_OWNER: 'tenant.owner',
  TENANT_ADMIN: 'tenant.admin',
  TENANT_MEMBER: 'tenant.member',
} as const;

export type RoleKey = (typeof ROLE_KEYS)[keyof typeof ROLE_KEYS];
