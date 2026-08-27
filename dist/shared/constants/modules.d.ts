export declare const MODULE_KEYS: {
    readonly HRM: "hrm";
    readonly LEADS: "leads";
    readonly CRM: "crm";
    readonly PAYROLL: "payroll";
    readonly ATTENDANCE: "attendance";
    readonly RECRUITMENT: "recruitment";
    readonly PROJECTS: "projects";
    readonly INVENTORY: "inventory";
    readonly POS: "pos";
    readonly ACCOUNTING: "accounting";
    readonly HELPDESK: "helpdesk";
    readonly ASSETS: "assets";
    readonly DOCUMENTS: "documents";
    readonly CUSTOMERS: "customers";
    readonly WEBSITE_BUILDER: "website_builder";
};
export type ModuleKey = (typeof MODULE_KEYS)[keyof typeof MODULE_KEYS];
