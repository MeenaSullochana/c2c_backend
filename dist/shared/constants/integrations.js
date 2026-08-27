"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.INTEGRATION_HEALTH_STATUSES = exports.DEFAULT_CREDENTIAL_RESOLUTION_ORDER = exports.CREDENTIAL_SOURCES = exports.INTEGRATION_PROVIDERS = exports.INTEGRATION_TYPES = void 0;
exports.INTEGRATION_TYPES = {
    EMAIL: 'email',
    SMS: 'sms',
    WHATSAPP: 'whatsapp',
    PAYMENTS: 'payments',
    MAPS: 'maps',
    STORAGE: 'storage',
    TRANSLATION: 'translation',
    PUSH: 'push',
    AI: 'ai',
    VIDEO: 'video',
    CALENDAR: 'calendar',
};
exports.INTEGRATION_PROVIDERS = {
    SMTP: 'smtp',
    SENDGRID: 'sendgrid',
    AMAZON_SES: 'amazon_ses',
    TWILIO: 'twilio',
    MSG91: 'msg91',
    WHATSAPP_CLOUD: 'whatsapp_cloud',
    RAZORPAY: 'razorpay',
    STRIPE: 'stripe',
    GOOGLE_MAPS: 'google_maps',
    MAPBOX: 'mapbox',
    LOCAL_STORAGE: 'local',
    AWS_S3: 'aws_s3',
    GOOGLE_TRANSLATE: 'google_translate',
    CUSTOM_TRANSLATION: 'custom_translation',
    FIREBASE_FCM: 'firebase_fcm',
    WEB_PUSH: 'web_push',
};
exports.CREDENTIAL_SOURCES = {
    TENANT: 'TENANT',
    PLATFORM: 'PLATFORM',
    SYSTEM: 'SYSTEM',
};
exports.DEFAULT_CREDENTIAL_RESOLUTION_ORDER = [
    exports.CREDENTIAL_SOURCES.TENANT,
    exports.CREDENTIAL_SOURCES.PLATFORM,
    exports.CREDENTIAL_SOURCES.SYSTEM,
];
exports.INTEGRATION_HEALTH_STATUSES = {
    NOT_CONFIGURED: 'NOT_CONFIGURED',
    CONNECTED: 'CONNECTED',
    DISABLED: 'DISABLED',
    ERROR: 'ERROR',
    EXPIRED: 'EXPIRED',
    RATE_LIMITED: 'RATE_LIMITED',
};
