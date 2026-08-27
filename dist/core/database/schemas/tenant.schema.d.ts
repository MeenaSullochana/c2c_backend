import { HydratedDocument } from 'mongoose';
export type TenantDocument = HydratedDocument<Tenant>;
export declare const TENANT_STATUSES: readonly ["ACTIVE", "SUSPENDED"];
export type TenantStatus = (typeof TENANT_STATUSES)[number];
export declare class Tenant {
    name: string;
    slug: string;
    status: TenantStatus;
    locale: string;
}
export declare const TenantSchema: import("mongoose").Schema<Tenant, import("mongoose").Model<Tenant, any, any, any, import("mongoose").Document<unknown, any, Tenant, any, {}> & Tenant & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Tenant, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<Tenant>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Tenant> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
