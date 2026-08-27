/**
 * Localization keys. Never use translated text as identifiers.
 * Phase 8 wires these to the translation engine.
 */
export const I18N_KEYS = {
  INTEGRATION_CONNECTED: 'integration.connected',
  INTEGRATION_DISABLED: 'integration.disabled',
  INTEGRATION_TEST_SUCCESS: 'integration.test_success',
  INTEGRATION_TEST_FAILED: 'integration.test_failed',
  PAYMENT_SUCCESS: 'payment.success',
  PAYMENT_FAILED: 'payment.failed',
  NOTIFICATION_SENT: 'notification.sent',
  NOTIFICATION_FAILED: 'notification.failed',
  HEALTH_OK: 'health.ok',
  HEALTH_DEGRADED: 'health.degraded',
  HEALTH_TITLE: 'health.title',
  HEALTH_CHECKING: 'health.checking',
  HEALTH_CONNECTED: 'health.connected',
  HEALTH_UNAVAILABLE: 'health.unavailable',
  PLATFORM_NAME: 'platform.name',
  PLATFORM_PHASE: 'platform.phase',
  PLATFORM_PHASE1_INTRO: 'platform.phase1_intro',
  PLATFORM_PHASE2_INTRO: 'platform.phase2_intro',
  COMMON_LOADING: 'common.loading',
  COMMON_NAME: 'common.name',
  COMMON_SLUG: 'common.slug',
  COMMON_ROLE: 'common.role',
  AUTH_LOGIN: 'auth.login',
  AUTH_REGISTER: 'auth.register',
  AUTH_LOGOUT: 'auth.logout',
  AUTH_EMAIL: 'auth.email',
  AUTH_PASSWORD: 'auth.password',
  AUTH_FIRST_NAME: 'auth.first_name',
  AUTH_LAST_NAME: 'auth.last_name',
  AUTH_TENANT_NAME: 'auth.tenant_name',
  AUTH_TENANT_SLUG: 'auth.tenant_slug',
  AUTH_INVALID: 'auth.invalid_credentials',
  AUTH_EMAIL_TAKEN: 'auth.email_taken',
  AUTH_TENANT_REQUIRED: 'auth.tenant_required',
  AUTH_HAVE_ACCOUNT: 'auth.have_account',
  AUTH_NO_ACCOUNT: 'auth.no_account',
  DASHBOARD_TITLE: 'dashboard.title',
  DASHBOARD_USERS: 'dashboard.users',
  DASHBOARD_WORKSPACE: 'dashboard.workspace',
} as const;

export type I18nKey = (typeof I18N_KEYS)[keyof typeof I18N_KEYS];

export const SUPPORTED_LOCALES = [
  'en',
  'ta',
  'hi',
  'ml',
  'te',
  'ar',
] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
