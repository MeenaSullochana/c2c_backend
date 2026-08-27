"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantsService = exports.updateTenantSchema = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const tenant_schema_1 = require("../database/schemas/tenant.schema");
const audit_service_1 = require("../audit/audit.service");
const zod_1 = require("zod");
exports.updateTenantSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(2).max(80).optional(),
    locale: zod_1.z.string().trim().min(2).max(8).optional(),
});
let TenantsService = class TenantsService {
    tenants;
    audit;
    constructor(tenants, audit) {
        this.tenants = tenants;
        this.audit = audit;
    }
    async getByIdForTenant(id, tenantId) {
        if (id !== tenantId) {
            throw new common_1.ForbiddenException('tenant.isolation_violation');
        }
        const tenant = await this.tenants.findById(tenantId).exec();
        if (!tenant) {
            throw new common_1.NotFoundException('tenant.not_found');
        }
        return this.toPublic(tenant);
    }
    async updateCurrent(tenantId, actorUserId, input) {
        const tenant = await this.tenants
            .findByIdAndUpdate(tenantId, { $set: input }, { new: true })
            .exec();
        if (!tenant) {
            throw new common_1.NotFoundException('tenant.not_found');
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
    toPublic(tenant) {
        return {
            id: String(tenant._id),
            name: tenant.name,
            slug: tenant.slug,
            status: tenant.status,
            locale: tenant.locale,
        };
    }
};
exports.TenantsService = TenantsService;
exports.TenantsService = TenantsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(tenant_schema_1.Tenant.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        audit_service_1.AuditService])
], TenantsService);
//# sourceMappingURL=tenants.service.js.map