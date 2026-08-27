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
exports.TenantsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const shared_1 = require("../../shared");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const zod_validation_pipe_1 = require("../../common/pipes/zod-validation.pipe");
const tenants_service_1 = require("./tenants.service");
const zod_1 = require("zod");
let TenantsController = class TenantsController {
    tenants;
    constructor(tenants) {
        this.tenants = tenants;
    }
    current(user) {
        return this.tenants.getByIdForTenant(user.tenantId, user.tenantId);
    }
    update(user, body) {
        return this.tenants.updateCurrent(user.tenantId, user.id, body);
    }
};
exports.TenantsController = TenantsController;
__decorate([
    (0, common_1.Get)('current'),
    (0, permissions_decorator_1.RequirePermissions)(shared_1.PERMISSIONS.TENANT_VIEW),
    (0, swagger_1.ApiOperation)({ summary: 'Get the current tenant' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TenantsController.prototype, "current", null);
__decorate([
    (0, common_1.Patch)('current'),
    (0, permissions_decorator_1.RequirePermissions)(shared_1.PERMISSIONS.TENANT_UPDATE),
    (0, swagger_1.ApiOperation)({ summary: 'Update the current tenant' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)(new zod_validation_pipe_1.ZodValidationPipe(tenants_service_1.updateTenantSchema))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, void 0]),
    __metadata("design:returntype", void 0)
], TenantsController.prototype, "update", null);
exports.TenantsController = TenantsController = __decorate([
    (0, swagger_1.ApiTags)('tenants'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('tenants'),
    __metadata("design:paramtypes", [tenants_service_1.TenantsService])
], TenantsController);
//# sourceMappingURL=tenants.controller.js.map