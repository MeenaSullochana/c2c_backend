import type { NextFunction, Request, Response } from 'express';
import { UserModel, TenantModel } from './models';
import { verifyAccessToken } from './auth-utils';

export function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    void handler(req, res, next).catch(next);
  };
}

export type AuthUser = {
  id: string;
  tenantId: string;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
  locale: string;
  roleKeys: string[];
  permissions: string[];
};

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthUser;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization ?? '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'auth.unauthorized' });
  }

  try {
    const payload = verifyAccessToken(token);
    const user = await UserModel.findOne({
      _id: payload.sub,
      tenantId: payload.tenantId,
      status: 'ACTIVE',
    }).exec();
    const tenant = user ? await TenantModel.findById(user.tenantId).exec() : null;

    if (!user || !tenant || tenant.status !== 'ACTIVE') {
      return res.status(401).json({ message: 'auth.unauthorized' });
    }

    req.authUser = {
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
    return next();
  } catch {
    return res.status(401).json({ message: 'auth.unauthorized' });
  }
}

export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.authUser?.permissions.includes(permission)) {
      return res.status(403).json({ message: 'auth.forbidden' });
    }
    return next();
  };
}
