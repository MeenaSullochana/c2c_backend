"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TENANT_MEMBER_PERMISSIONS = exports.TENANT_ADMIN_PERMISSIONS = exports.TENANT_OWNER_PERMISSIONS = exports.PERMISSIONS = void 0;
exports.PERMISSIONS = {
    TENANT_VIEW: 'tenant.view',
    TENANT_UPDATE: 'tenant.update',
    USER_VIEW: 'user.view',
    USER_CREATE: 'user.create',
    USER_UPDATE: 'user.update',
    USER_DEACTIVATE: 'user.deactivate',
    ROLE_VIEW: 'role.view',
    ROLE_ASSIGN: 'role.assign',
    INTEGRATION_VIEW: 'integration.view',
    INTEGRATION_ENABLE: 'integration.enable',
    INTEGRATION_DISABLE: 'integration.disable',
    INTEGRATION_CONFIGURE: 'integration.configure',
    INTEGRATION_TEST: 'integration.test',
    INTEGRATION_VIEW_LOGS: 'integration.view_logs',
    INTEGRATION_MANAGE_CREDENTIALS: 'integration.manage_credentials',
    BILLING_PAYMENT_CREATE: 'billing.payment.create',
    BILLING_PAYMENT_REFUND: 'billing.payment.refund',
    NOTIFICATION_SEND: 'notification.send',
    NOTIFICATION_MANAGE_TEMPLATES: 'notification.manage_templates',
    API_KEY_CREATE: 'api_key.create',
    API_KEY_REVOKE: 'api_key.revoke',
    WEBHOOK_CREATE: 'webhook.create',
    WEBHOOK_DELETE: 'webhook.delete',
};
exports.TENANT_OWNER_PERMISSIONS = Object.values(exports.PERMISSIONS);
exports.TENANT_ADMIN_PERMISSIONS = [
    exports.PERMISSIONS.TENANT_VIEW,
    exports.PERMISSIONS.USER_VIEW,
    exports.PERMISSIONS.USER_CREATE,
    exports.PERMISSIONS.USER_UPDATE,
    exports.PERMISSIONS.ROLE_VIEW,
    exports.PERMISSIONS.INTEGRATION_VIEW,
];
exports.TENANT_MEMBER_PERMISSIONS = [exports.PERMISSIONS.TENANT_VIEW];
//# sourceMappingURL=permissions.js.map