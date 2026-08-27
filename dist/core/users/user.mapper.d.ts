import type { AuthUser } from '../auth/auth.types';
export type UserLike = {
    _id: {
        toString(): string;
    } | string;
    tenantId: {
        toString(): string;
    } | string;
    email: string;
    firstName: string;
    lastName: string;
    status: string;
    locale: string;
    roleKeys: string[];
    permissions: string[];
};
export declare function toAuthUser(user: UserLike): AuthUser;
