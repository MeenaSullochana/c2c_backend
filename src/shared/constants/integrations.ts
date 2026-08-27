export const INTEGRATION_TYPES = {
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
} as const;

export type IntegrationType =
  (typeof INTEGRATION_TYPES)[keyof typeof INTEGRATION_TYPES];

export const INTEGRATION_PROVIDERS = {
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
} as const;

export type IntegrationProviderKey =
  (typeof INTEGRATION_PROVIDERS)[keyof typeof INTEGRATION_PROVIDERS];

export const CREDENTIAL_SOURCES = {
  TENANT: 'TENANT',
  PLATFORM: 'PLATFORM',
  SYSTEM: 'SYSTEM',
} as const;

export type CredentialSource =
  (typeof CREDENTIAL_SOURCES)[keyof typeof CREDENTIAL_SOURCES];

export const DEFAULT_CREDENTIAL_RESOLUTION_ORDER: CredentialSource[] = [
  CREDENTIAL_SOURCES.TENANT,
  CREDENTIAL_SOURCES.PLATFORM,
  CREDENTIAL_SOURCES.SYSTEM,
];

export const INTEGRATION_HEALTH_STATUSES = {
  NOT_CONFIGURED: 'NOT_CONFIGURED',
  CONNECTED: 'CONNECTED',
  DISABLED: 'DISABLED',
  ERROR: 'ERROR',
  EXPIRED: 'EXPIRED',
  RATE_LIMITED: 'RATE_LIMITED',
} as const;
