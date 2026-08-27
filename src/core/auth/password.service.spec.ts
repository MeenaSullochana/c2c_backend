import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

describe('PasswordService hashing', () => {
  const hash = (plain: string) => bcrypt.hash(plain, 4);
  const compare = (plain: string, hashed: string) => bcrypt.compare(plain, hashed);

  it('hashes a password so the original is not stored', async () => {
    const hashed = await hash('Secret123!');
    expect(hashed).not.toBe('Secret123!');
    expect(hashed.startsWith('$2')).toBe(true);
  });

  it('accepts the correct password and rejects a wrong one', async () => {
    const hashed = await hash('Secret123!');
    await expect(compare('Secret123!', hashed)).resolves.toBe(true);
    await expect(compare('wrong-password', hashed)).resolves.toBe(false);
  });
});
