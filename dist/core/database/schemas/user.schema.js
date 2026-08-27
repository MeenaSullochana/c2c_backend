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
exports.UserSchema = exports.User = exports.USER_STATUSES = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
exports.USER_STATUSES = ['ACTIVE', 'INVITED', 'DEACTIVATED'];
let User = class User {
    tenantId;
    email;
    passwordHash;
    firstName;
    lastName;
    status;
    locale;
    roleKeys;
    permissions;
    lastLoginAt;
};
exports.User = User;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Tenant', required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], User.prototype, "tenantId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, lowercase: true, trim: true }),
    __metadata("design:type", String)
], User.prototype, "email", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, select: false }),
    __metadata("design:type", String)
], User.prototype, "passwordHash", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], User.prototype, "firstName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], User.prototype, "lastName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: exports.USER_STATUSES, default: 'ACTIVE' }),
    __metadata("design:type", String)
], User.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 'en' }),
    __metadata("design:type", String)
], User.prototype, "locale", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], required: true, default: [] }),
    __metadata("design:type", Array)
], User.prototype, "roleKeys", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], required: true, default: [] }),
    __metadata("design:type", Array)
], User.prototype, "permissions", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], User.prototype, "lastLoginAt", void 0);
exports.User = User = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true, collection: 'users' })
], User);
exports.UserSchema = mongoose_1.SchemaFactory.createForClass(User);
exports.UserSchema.index({ tenantId: 1, email: 1 }, { unique: true });
exports.UserSchema.set('toJSON', {
    transform: (_doc, ret) => {
        const record = ret;
        delete record.passwordHash;
        delete record.__v;
        record.id = String(record._id);
        return record;
    },
});
//# sourceMappingURL=user.schema.js.map