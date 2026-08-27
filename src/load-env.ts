import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export function loadEnv(): void {
  const files = [resolve(process.cwd(), '.env'), resolve(process.cwd(), '../.env')];

  for (const file of files) {
    try {
      const text = readFileSync(file, 'utf8');
      for (const rawLine of text.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || line.startsWith('#')) {
          continue;
        }
        const eq = line.indexOf('=');
        if (eq === -1) {
          continue;
        }
        const key = line.slice(0, eq).trim();
        const value = line.slice(eq + 1).trim();
        if (key && process.env[key] === undefined) {
          process.env[key] = value;
        }
      }
    } catch {
      // ignore missing files
    }
  }
}
