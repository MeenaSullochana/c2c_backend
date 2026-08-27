import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuditLog, AuditLogDocument } from '../database/schemas/audit-log.schema';

@Injectable()
export class AuditService {
  constructor(
    @InjectModel(AuditLog.name)
    private readonly logs: Model<AuditLogDocument>,
  ) {}

  async record(input: {
    action: string;
    tenantId?: string;
    actorUserId?: string;
    resource?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    await this.logs.create({
      action: input.action,
      tenantId: input.tenantId ? new Types.ObjectId(input.tenantId) : undefined,
      actorUserId: input.actorUserId
        ? new Types.ObjectId(input.actorUserId)
        : undefined,
      resource: input.resource,
      metadata: input.metadata,
    });
  }
}
