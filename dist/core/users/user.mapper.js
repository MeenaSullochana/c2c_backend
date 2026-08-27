"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toAuthUser = toAuthUser;
function toAuthUser(user) {
    return {
        id: String(user._id),
        tenantId: String(user.tenantId),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        status: user.status,
        locale: user.locale,
        roleKeys: user.roleKeys,
        permissions: user.permissions,
    };
}
//# sourceMappingURL=user.mapper.js.map