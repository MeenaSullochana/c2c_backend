import { ZodValidationPipe } from './zod-validation.pipe';
import { z } from 'zod';

describe('ZodValidationPipe', () => {
  const pipe = new ZodValidationPipe(
    z.object({
      name: z.string().min(1),
    }),
  );

  it('returns parsed data for valid input', () => {
    expect(pipe.transform({ name: 'c2c' }, { type: 'body' })).toEqual({
      name: 'c2c',
    });
  });

  it('throws on invalid input', () => {
    expect(() => pipe.transform({ name: '' }, { type: 'body' })).toThrow();
  });
});
