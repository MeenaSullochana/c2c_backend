import { Model } from 'mongoose';
import { AuditLogDocument } from '../database/schemas/audit-log.schema';
export declare class AuditService {
    private readonly logs;
    constructor(logs: Model<AuditLogDocument>);
    record(input: {
        action: string;
        tenantId?: string;
        actorUserId?: string;
        resource?: string;
        metadata?: Record<string, unknown>;
    }): Promise<void>;
}
