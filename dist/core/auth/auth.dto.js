"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    tenantName: zod_1.z.string().trim().min(2).max(80),
    email: zod_1.z.string().trim().email().max(255),
    password: zod_1.z.string().min(8).max(72),
    firstName: zod_1.z.string().trim().min(1).max(80),
    lastName: zod_1.z.string().trim().min(1).max(80),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().trim().email().max(255),
    password: zod_1.z.string().min(1).max(72),
    tenantSlug: zod_1.z.string().trim().min(1).max(80).optional(),
});
exports.refreshSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(16),
});
//# sourceMappingURL=auth.dto.js.map