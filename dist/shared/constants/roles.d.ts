export declare const ROLE_KEYS: {
    readonly TENANT_OWNER: "tenant.owner";
    readonly TENANT_ADMIN: "tenant.admin";
    readonly TENANT_MEMBER: "tenant.member";
};
export type RoleKey = (typeof ROLE_KEYS)[keyof typeof ROLE_KEYS];
