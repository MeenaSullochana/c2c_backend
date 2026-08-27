import type { AuthUser } from '../auth/auth.types';

export type UserLike = {
  _id: { toString(): string } | string;
  tenantId: { toString(): string } | string;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
  locale: string;
  roleKeys: string[];
  permissions: string[];
};

export function toAuthUser(user: UserLike): AuthUser {
  return {
    id: String(user._id),
    tenantId: String(user.tenantId),
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    status: user.status,
    locale: user.locale,
    roleKeys: user.roleKeys,
    permissions: user.permissions,
  };
}
