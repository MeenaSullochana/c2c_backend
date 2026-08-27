import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { env } from './config';
import { connectDb } from './db';
import { ApiException } from './http-error';
import { requireAuth, requirePermission } from './middleware';
import { TenantModel, UserModel } from './models';
import { authRouter } from './routes-auth';
import { dashboardRouter } from './routes-dashboard';
import { hrmRouter } from './routes-hrm';
import { leadRouter } from './routes-leads';
import { branchRouter, locationRouter } from './routes-locations';
import { publicTenant, publicUser } from './auth-utils';
import { PERMISSIONS } from './shared';

async function bootstrap() {
  await connectDb();

  const app = express();
  app.use(helmet());
  app.use(
    cors({
      origin: true,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '10mb' }));

  app.get('/api/health', (_req, res) => {
    const mongoUp = mongoose.connection.readyState === 1;
    res.status(mongoUp ? 200 : 503).json({
      status: mongoUp ? 'ok' : 'error',
      info: {
        mongodb: { status: mongoUp ? 'up' : 'down' },
      },
    });
  });

  app.get('/api/health/ready', (_req, res) => {
    const mongoUp = mongoose.connection.readyState === 1;
    res.status(mongoUp ? 200 : 503).json({
      status: mongoUp ? 'ok' : 'error',
    });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/dashboard', dashboardRouter);
  app.use('/api/locations', locationRouter);
  app.use('/api/branches', branchRouter);
  app.use('/api/hrm', hrmRouter);
  app.use('/api/leads', leadRouter);

  app.get(
    '/api/users',
    requireAuth,
    requirePermission(PERMISSIONS.USER_VIEW),
    async (req, res) => {
      const users = await UserModel.find({ tenantId: req.authUser?.tenantId })
        .sort({ createdAt: -1 })
        .exec();
      const tenant = await TenantModel.findById(req.authUser?.tenantId).exec();
      if (!tenant) {
        return res.status(404).json({ message: 'tenant.not_found' });
      }
      return res.json(users.map((user) => publicUser(user, tenant)));
    },
  );

  app.get(
    '/api/tenants/current',
    requireAuth,
    requirePermission(PERMISSIONS.TENANT_VIEW),
    async (req, res) => {
      const tenant = await TenantModel.findById(req.authUser?.tenantId).exec();
      if (!tenant) {
        return res.status(404).json({ message: 'tenant.not_found' });
      }
      return res.json(publicTenant(tenant));
    },
  );

  app.patch(
    '/api/tenants/current',
    requireAuth,
    requirePermission(PERMISSIONS.TENANT_UPDATE),
    async (req, res) => {
      const tenant = await TenantModel.findById(req.authUser?.tenantId).exec();
      if (!tenant) {
        return res.status(404).json({ message: 'tenant.not_found' });
      }
      const body = req.body as Record<string, unknown>;
      const fields = ['name', 'brandName', 'tagline', 'logoUrl', 'supportEmail', 'supportPhone', 'address', 'website', 'locale'] as const;
      for (const field of fields) {
        if (typeof body[field] === 'string') {
          (tenant as unknown as Record<string, string>)[field] = body[field] as string;
        }
      }
      await tenant.save();
      return res.json(publicTenant(tenant));
    },
  );

  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (error instanceof ApiException) {
      return res.status(error.status).json({ message: error.message });
    }
    console.error(error instanceof Error ? error.message : error);
    return res.status(500).json({ message: 'Internal server error' });
  });

  app.listen(env.API_PORT, () => {
    console.log(`Node API listening on http://localhost:${env.API_PORT}/api`);
  });
}

bootstrap().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
