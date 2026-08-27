"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const bcrypt = __importStar(require("bcryptjs"));
const mongoose_1 = __importStar(require("mongoose"));
const shared_1 = require("../../shared");
const DEMO_PASSWORD = 'Password123!';
const TenantModel = mongoose_1.default.model('Tenant', new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    status: { type: String, required: true, enum: ['ACTIVE', 'SUSPENDED'], default: 'ACTIVE' },
    locale: { type: String, required: true, default: 'en' },
}, { timestamps: true, collection: 'tenants' }));
const UserModel = mongoose_1.default.model('User', new mongoose_1.Schema({
    tenantId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    status: {
        type: String,
        required: true,
        enum: ['ACTIVE', 'INVITED', 'DEACTIVATED'],
        default: 'ACTIVE',
    },
    locale: { type: String, required: true, default: 'en' },
    roleKeys: { type: [String], required: true, default: [] },
    permissions: { type: [String], required: true, default: [] },
    lastLoginAt: { type: Date },
}, { timestamps: true, collection: 'users' }));
function loadEnv() {
    const files = [(0, node_path_1.resolve)(process.cwd(), '.env'), (0, node_path_1.resolve)(process.cwd(), '../.env')];
    for (const file of files) {
        try {
            const text = (0, node_fs_1.readFileSync)(file, 'utf8');
            for (const rawLine of text.split(/\r?\n/)) {
                const line = rawLine.trim();
                if (!line || line.startsWith('#')) {
                    continue;
                }
                const separator = line.indexOf('=');
                if (separator === -1) {
                    continue;
                }
                const key = line.slice(0, separator).trim();
                const value = line.slice(separator + 1).trim();
                if (key && process.env[key] === undefined) {
                    process.env[key] = value;
                }
            }
        }
        catch {
        }
    }
}
async function main() {
    loadEnv();
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        throw new Error('MONGODB_URI is missing');
    }
    await mongoose_1.default.connect(uri);
    console.log('Connected to MongoDB database c2c');
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
    const acme = await TenantModel.findOneAndUpdate({ slug: 'acme-hr' }, {
        $set: {
            name: 'Acme HR',
            slug: 'acme-hr',
            status: 'ACTIVE',
            locale: 'en',
        },
    }, { upsert: true, new: true });
    const nimbus = await TenantModel.findOneAndUpdate({ slug: 'nimbus-leads' }, {
        $set: {
            name: 'Nimbus Leads',
            slug: 'nimbus-leads',
            status: 'ACTIVE',
            locale: 'en',
        },
    }, { upsert: true, new: true });
    const users = [
        {
            tenantId: acme._id,
            email: 'owner@acme.test',
            firstName: 'Asha',
            lastName: 'Iyer',
            roleKeys: [shared_1.ROLE_KEYS.TENANT_OWNER],
            permissions: [...shared_1.TENANT_OWNER_PERMISSIONS],
        },
        {
            tenantId: acme._id,
            email: 'admin@acme.test',
            firstName: 'Rahul',
            lastName: 'Menon',
            roleKeys: [shared_1.ROLE_KEYS.TENANT_ADMIN],
            permissions: [...shared_1.TENANT_ADMIN_PERMISSIONS],
        },
        {
            tenantId: acme._id,
            email: 'member@acme.test',
            firstName: 'Priya',
            lastName: 'Nair',
            roleKeys: [shared_1.ROLE_KEYS.TENANT_MEMBER],
            permissions: [...shared_1.TENANT_MEMBER_PERMISSIONS],
        },
        {
            tenantId: nimbus._id,
            email: 'owner@nimbus.test',
            firstName: 'Omar',
            lastName: 'Khan',
            roleKeys: [shared_1.ROLE_KEYS.TENANT_OWNER],
            permissions: [...shared_1.TENANT_OWNER_PERMISSIONS],
        },
        {
            tenantId: nimbus._id,
            email: 'sales@nimbus.test',
            firstName: 'Lina',
            lastName: 'George',
            roleKeys: [shared_1.ROLE_KEYS.TENANT_ADMIN],
            permissions: [...shared_1.TENANT_ADMIN_PERMISSIONS],
        },
    ];
    for (const user of users) {
        await UserModel.findOneAndUpdate({ tenantId: user.tenantId, email: user.email }, { $set: { ...user, status: 'ACTIVE', locale: 'en', passwordHash } }, { upsert: true, new: true });
    }
    console.log('Seeded workspaces: acme-hr, nimbus-leads');
    console.log('Demo password for all seeded users: Password123!');
    console.log('Logins: owner@acme.test, admin@acme.test, member@acme.test, owner@nimbus.test, sales@nimbus.test');
    await mongoose_1.default.disconnect();
}
main().catch(async (error) => {
    console.error(error instanceof Error ? error.message : error);
    await mongoose_1.default.disconnect().catch(() => undefined);
    process.exit(1);
});
//# sourceMappingURL=seed.js.map