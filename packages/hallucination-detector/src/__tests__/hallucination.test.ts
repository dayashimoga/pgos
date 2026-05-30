import { describe, it, expect, afterAll } from 'vitest';
import { detectHallucinations } from '../index.js';
import { join, dirname } from 'path';
import { mkdir, writeFile, rm } from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('PGOS Hallucination Detector', () => {
  const mockRoot = join(__dirname, 'mock-project-hallucination');

  afterAll(async () => {
    await rm(mockRoot, { recursive: true, force: true });
  });

  it('should detect hallucinated dependencies not in package.json', async () => {
    await mkdir(join(mockRoot, 'src'), { recursive: true });

    // Create a package.json with known dependencies
    await writeFile(join(mockRoot, 'package.json'), JSON.stringify({
      name: 'test-app',
      dependencies: { 'express': '^4.0.0' },
    }));

    // Create a file that imports a non-existent package
    await writeFile(join(mockRoot, 'src', 'app.ts'), `
import express from 'express';
import { magic } from 'non-existent-package-xyz';

const app = express();
`);

    const result = await detectHallucinations(mockRoot);
    expect(result.issues.length).toBeGreaterThan(0);
    expect(result.issues.some((i) => i.type === 'hallucinated_dependency')).toBe(true);
    expect(result.issues.some((i) => i.explanation.includes('non-existent-package-xyz'))).toBe(true);
  });

  it('should NOT flag installed dependencies', async () => {
    await writeFile(join(mockRoot, 'src', 'valid.ts'), `
import express from 'express';
const app = express();
`);

    const result = await detectHallucinations(mockRoot);
    const expressIssues = result.issues.filter((i) => i.explanation.includes('express'));
    expect(expressIssues.length).toBe(0);
  });

  it('should detect nonexistent API patterns', async () => {
    await writeFile(join(mockRoot, 'src', 'bad-api.ts'), `
const parsed = JSON.tryParse('{}');
const items = Array.flatten([1, [2, 3]]);
const envVal = process.env.get('KEY');
`);

    const result = await detectHallucinations(mockRoot);
    const apiIssues = result.issues.filter((i) => i.type === 'nonexistent_api');
    expect(apiIssues.length).toBeGreaterThan(0);
  });

  it('should compute a hallucination score', async () => {
    const result = await detectHallucinations(mockRoot);
    expect(typeof result.score).toBe('number');
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('should handle empty projects gracefully', async () => {
    const emptyRoot = join(__dirname, 'mock-empty-project');
    await mkdir(emptyRoot, { recursive: true });
    await writeFile(join(emptyRoot, 'package.json'), JSON.stringify({ name: 'empty' }));

    const result = await detectHallucinations(emptyRoot);
    expect(result.score).toBe(100);
    expect(result.issues.length).toBe(0);

    await rm(emptyRoot, { recursive: true, force: true });
  });
});
