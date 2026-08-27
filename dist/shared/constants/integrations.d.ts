export declare const INTEGRATION_TYPES: {
    readonly EMAIL: "email";
    readonly SMS: "sms";
    readonly WHATSAPP: "whatsapp";
    readonly PAYMENTS: "payments";
    readonly MAPS: "maps";
    readonly STORAGE: "storage";
    readonly TRANSLATION: "translation";
    readonly PUSH: "push";
    readonly AI: "ai";
    readonly VIDEO: "video";
    readonly CALENDAR: "calendar";
};
export type IntegrationType = (typeof INTEGRATION_TYPES)[keyof typeof INTEGRATION_TYPES];
export declare const INTEGRATION_PROVIDERS: {
    readonly SMTP: "smtp";
    readonly SENDGRID: "sendgrid";
    readonly AMAZON_SES: "amazon_ses";
    readonly TWILIO: "twilio";
    readonly MSG91: "msg91";
    readonly WHATSAPP_CLOUD: "whatsapp_cloud";
    readonly RAZORPAY: "razorpay";
    readonly STRIPE: "stripe";
    readonly GOOGLE_MAPS: "google_maps";
    readonly MAPBOX: "mapbox";
    readonly LOCAL_STORAGE: "local";
    readonly AWS_S3: "aws_s3";
    readonly GOOGLE_TRANSLATE: "google_translate";
    readonly CUSTOM_TRANSLATION: "custom_translation";
    readonly FIREBASE_FCM: "firebase_fcm";
    readonly WEB_PUSH: "web_push";
};
export type IntegrationProviderKey = (typeof INTEGRATION_PROVIDERS)[keyof typeof INTEGRATION_PROVIDERS];
export declare const CREDENTIAL_SOURCES: {
    readonly TENANT: "TENANT";
    readonly PLATFORM: "PLATFORM";
    readonly SYSTEM: "SYSTEM";
};
export type CredentialSource = (typeof CREDENTIAL_SOURCES)[keyof typeof CREDENTIAL_SOURCES];
export declare const DEFAULT_CREDENTIAL_RESOLUTION_ORDER: CredentialSource[];
export declare const INTEGRATION_HEALTH_STATUSES: {
    readonly NOT_CONFIGURED: "NOT_CONFIGURED";
    readonly CONNECTED: "CONNECTED";
    readonly DISABLED: "DISABLED";
    readonly ERROR: "ERROR";
    readonly EXPIRED: "EXPIRED";
    readonly RATE_LIMITED: "RATE_LIMITED";
};
