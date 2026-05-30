import { describe, it, expect, afterAll } from 'vitest';
import { checkCompletion, detectAntiPatterns } from '../completeness/checker.js';
import { join, dirname } from 'path';
import { mkdir, writeFile, rm } from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('PGOS Validation Engine', () => {
  const mockRoot = join(__dirname, 'mock-project-validate');

  afterAll(async () => {
    await rm(mockRoot, { recursive: true, force: true });
  });

  describe('detectAntiPatterns', () => {
    it('should detect TODO markers in source files', async () => {
      await mkdir(join(mockRoot, 'src'), { recursive: true });
      await writeFile(join(mockRoot, 'src', 'todo.ts'), `
export function doSomething() {
  // TODO: implement this properly
  return null;
}
`);
      const patterns = await detectAntiPatterns([join(mockRoot, 'src', 'todo.ts')]);
      expect(patterns.length).toBeGreaterThan(0);
      expect(patterns.some((p) => p.type === 'todo')).toBe(true);
    });

    it('should detect FIXME markers', async () => {
      await writeFile(join(mockRoot, 'src', 'fixme.ts'), `
// FIXME: this is broken
export const broken = true;
`);
      const patterns = await detectAntiPatterns([join(mockRoot, 'src', 'fixme.ts')]);
      expect(patterns.some((p) => p.type === 'fixme')).toBe(true);
    });

    it('should detect placeholder content', async () => {
      await writeFile(join(mockRoot, 'src', 'placeholder.ts'), `
export const apiUrl = 'https://example.com/api';
`);
      const patterns = await detectAntiPatterns([join(mockRoot, 'src', 'placeholder.ts')]);
      expect(patterns.some((p) => p.type === 'placeholder')).toBe(true);
    });

    it('should detect hardcoded secrets', async () => {
      await writeFile(join(mockRoot, 'src', 'secrets.ts'), `
const password = "SuperSecret123!";
`);
      const patterns = await detectAntiPatterns([join(mockRoot, 'src', 'secrets.ts')]);
      expect(patterns.some((p) => p.type === 'hardcoded')).toBe(true);
    });

    it('should return empty array for clean files', async () => {
      await writeFile(join(mockRoot, 'src', 'clean.ts'), `
export function add(a: number, b: number): number {
  return a + b;
}
`);
      const patterns = await detectAntiPatterns([join(mockRoot, 'src', 'clean.ts')]);
      expect(patterns.length).toBe(0);
    });

    it('should handle unreadable files gracefully', async () => {
      const patterns = await detectAntiPatterns(['/nonexistent/file.ts']);
      expect(patterns).toEqual([]);
    });
  });

  describe('checkCompletion', () => {
    it('should score requirements against codebase implementation', async () => {
      await mkdir(join(mockRoot, 'src'), { recursive: true });
      await writeFile(join(mockRoot, 'src', 'auth.ts'), `
export class AuthService {
  async login(username: string, password: string) {
    return { token: 'abc' };
  }
  async logout() {
    return true;
  }
}
`);

      const result = await checkCompletion(mockRoot, ['authentication login']);
      expect(result.overall).toBeGreaterThan(0);
      expect(result.requirements.length).toBe(1);
      expect(result.totalRequirements).toBe(1);
    });

    it('should mark absent requirements correctly', async () => {
      const result = await checkCompletion(mockRoot, ['quantum teleportation engine']);
      expect(result.requirements[0].status).toBe('absent');
      expect(result.requirements[0].score).toBe(0);
    });

    it('should detect stubs in requirement evidence', async () => {
      await writeFile(join(mockRoot, 'src', 'stubbed.ts'), `
export function payment() {
  // TODO: implement payment processing
  return null;
}
`);
      const result = await checkCompletion(mockRoot, ['payment processing']);
      const paymentReq = result.requirements[0];
      expect(paymentReq).toBeDefined();
      // Should detect the stub
      if (paymentReq.evidence.length > 0) {
        expect(paymentReq.status).toBe('stub');
      }
    });

    it('should handle empty requirements list', async () => {
      const result = await checkCompletion(mockRoot, []);
      expect(result.overall).toBe(100);
      expect(result.totalRequirements).toBe(0);
    });
  });
});
