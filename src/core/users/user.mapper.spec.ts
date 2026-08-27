import { toAuthUser } from './user.mapper';

describe('toAuthUser', () => {
  it('omits passwordHash from the public user payload', () => {
    const mapped = toAuthUser({
      _id: '64b000000000000000000001',
      tenantId: '64b000000000000000000002',
      email: 'owner@example.com',
      firstName: 'Ada',
      lastName: 'Lovelace',
      status: 'ACTIVE',
      locale: 'en',
      roleKeys: ['tenant.owner'],
      permissions: ['user.view'],
    });

    expect(mapped).not.toHaveProperty('passwordHash');
    expect(mapped.email).toBe('owner@example.com');
  });
});
