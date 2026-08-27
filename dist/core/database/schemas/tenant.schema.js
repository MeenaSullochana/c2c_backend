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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantSchema = exports.Tenant = exports.TENANT_STATUSES = void 0;
const mongoose_1 = require("@nestjs/mongoose");
exports.TENANT_STATUSES = ['ACTIVE', 'SUSPENDED'];
let Tenant = class Tenant {
    name;
    slug;
    status;
    locale;
};
exports.Tenant = Tenant;
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], Tenant.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true, lowercase: true, trim: true }),
    __metadata("design:type", String)
], Tenant.prototype, "slug", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: exports.TENANT_STATUSES, default: 'ACTIVE' }),
    __metadata("design:type", String)
], Tenant.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 'en' }),
    __metadata("design:type", String)
], Tenant.prototype, "locale", void 0);
exports.Tenant = Tenant = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true, collection: 'tenants' })
], Tenant);
exports.TenantSchema = mongoose_1.SchemaFactory.createForClass(Tenant);
//# sourceMappingURL=tenant.schema.js.map