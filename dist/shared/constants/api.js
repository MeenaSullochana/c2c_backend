"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.API_ROUTES = exports.API_PREFIX = void 0;
exports.API_PREFIX = 'api';
exports.API_ROUTES = {
    HEALTH: '/health',
    HEALTH_READY: '/health/ready',
    DOCS: '/docs',
    AUTH_REGISTER: '/auth/register',
    AUTH_LOGIN: '/auth/login',
    AUTH_REFRESH: '/auth/refresh',
    AUTH_LOGOUT: '/auth/logout',
    AUTH_ME: '/auth/me',
    TENANT_CURRENT: '/tenants/current',
    USERS: '/users',
    DASHBOARD_SUMMARY: '/dashboard/summary',
    LOCATIONS_TREE: '/locations/tree',
    LOCATIONS_COUNTRIES: '/locations/countries',
    LOCATIONS_STATES: '/locations/states',
    LOCATIONS_CITIES: '/locations/cities',
    BRANCHES: '/branches',
    HRM_DEPARTMENTS: '/hrm/departments',
    HRM_DESIGNATIONS: '/hrm/designations',
    HRM_ROLES: '/hrm/roles',
    HRM_EMPLOYEES: '/hrm/employees',
    HRM_LEAVE_TYPES: '/hrm/leave-types',
    HRM_LEAVES: '/hrm/leaves',
    HRM_ATTENDANCE: '/hrm/attendance',
    LEADS: '/leads',
    LEAD_REMINDERS: '/leads/reminders',
};
