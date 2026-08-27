import { Model } from 'mongoose';
import { TenantDocument } from '../database/schemas/tenant.schema';
import { AuditService } from '../audit/audit.service';
import { z } from 'zod';
export declare const updateTenantSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    locale: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    locale?: string | undefined;
    name?: string | undefined;
}, {
    locale?: string | undefined;
    name?: string | undefined;
}>;
export declare class TenantsService {
    private readonly tenants;
    private readonly audit;
    constructor(tenants: Model<TenantDocument>, audit: AuditService);
    getByIdForTenant(id: string, tenantId: string): Promise<{
        id: string;
        name: string;
        slug: string;
        status: "ACTIVE" | "SUSPENDED";
        locale: string;
    }>;
    updateCurrent(tenantId: string, actorUserId: string, input: z.infer<typeof updateTenantSchema>): Promise<{
        id: string;
        name: string;
        slug: string;
        status: "ACTIVE" | "SUSPENDED";
        locale: string;
    }>;
    toPublic(tenant: TenantDocument): {
        id: string;
        name: string;
        slug: string;
        status: "ACTIVE" | "SUSPENDED";
        locale: string;
    };
}
