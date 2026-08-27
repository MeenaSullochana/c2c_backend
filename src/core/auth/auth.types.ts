export type JwtAccessPayload = {
  sub: string;
  tenantId: string;
};

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

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
};

export type PublicUser = AuthUser & {
  tenant: {
    id: string;
    name: string;
    slug: string;
    status: string;
    locale: string;
  };
};
