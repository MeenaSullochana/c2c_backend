import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Tenant, TenantDocument } from '../database/schemas/tenant.schema';
import { AuditService } from '../audit/audit.service';
import { z } from 'zod';

export const updateTenantSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  locale: z.string().trim().min(2).max(8).optional(),
});

@Injectable()
export class TenantsService {
  constructor(
    @InjectModel(Tenant.name) private readonly tenants: Model<TenantDocument>,
    private readonly audit: AuditService,
  ) {}

  async getByIdForTenant(id: string, tenantId: string) {
    if (id !== tenantId) {
      throw new ForbiddenException('tenant.isolation_violation');
    }

    const tenant = await this.tenants.findById(tenantId).exec();
    if (!tenant) {
      throw new NotFoundException('tenant.not_found');
    }

    return this.toPublic(tenant);
  }

  async updateCurrent(
    tenantId: string,
    actorUserId: string,
    input: z.infer<typeof updateTenantSchema>,
  ) {
    const tenant = await this.tenants
      .findByIdAndUpdate(tenantId, { $set: input }, { new: true })
      .exec();

    if (!tenant) {
      throw new NotFoundException('tenant.not_found');
    }

    await this.audit.record({
      action: 'tenant.updated',
      tenantId,
      actorUserId,
      resource: 'tenant',
      metadata: { fields: Object.keys(input) },
    });

    return this.toPublic(tenant);
  }

  toPublic(tenant: TenantDocument) {
    return {
      id: String(tenant._id),
      name: tenant.name,
      slug: tenant.slug,
      status: tenant.status,
      locale: tenant.locale,
    };
  }
}
