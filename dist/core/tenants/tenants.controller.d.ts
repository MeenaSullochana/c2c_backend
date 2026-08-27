import type { AuthUser } from '../auth/auth.types';
import { TenantsService, updateTenantSchema } from './tenants.service';
import { z } from 'zod';
export declare class TenantsController {
    private readonly tenants;
    constructor(tenants: TenantsService);
    current(user: AuthUser): Promise<{
        id: string;
        name: string;
        slug: string;
        status: "ACTIVE" | "SUSPENDED";
        locale: string;
    }>;
    update(user: AuthUser, body: z.infer<typeof updateTenantSchema>): Promise<{
        id: string;
        name: string;
        slug: string;
        status: "ACTIVE" | "SUSPENDED";
        locale: string;
    }>;
}
