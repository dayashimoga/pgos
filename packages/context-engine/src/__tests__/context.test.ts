import { describe, it, expect, afterAll } from 'vitest';
import { compileContext } from '../compiler/context-compiler.js';
import { join, dirname } from 'path';
import { mkdir, writeFile, rm } from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('PGOS Context Graph Engine', () => {
  const mockRoot = join(__dirname, 'mock-project');

  afterAll(async () => {
    await rm(mockRoot, { recursive: true, force: true });
  });

  it('should compile context levels and construct a clean CodebaseGraph', async () => {
    // 1. Create a transient mock workspace inside packages/context-engine/src/__tests__/mock-project
    await mkdir(mockRoot, { recursive: true });
    
    // Create a typescript file with imports, functions, and classes
    const codeContent = `
import { logger } from '@pgos/core';
import { getDb } from './db/db.js';

export class BaseService {}

export function calculateMetrics(a: number, b: number): number {
  return a + b;
}

export class MetricsService extends BaseService {
  process() {
    return 'done';
  }
}
`;
    await mkdir(join(mockRoot, 'src', 'db'), { recursive: true });
    await writeFile(join(mockRoot, 'src', 'index.ts'), codeContent);
    await writeFile(join(mockRoot, 'src', 'db', 'db.ts'), 'export function getDb() { return {}; }');

    // 2. Execute compilation
    const result = await compileContext('test-project', mockRoot, {
      levels: ['L0'],
    });

    expect(result.filesProcessed).toBeGreaterThan(0);
    const l0Package = result.packages.get('L0')!;
    const graph = l0Package.content.codebaseGraph!;

    expect(graph).toBeDefined();
    expect(graph.nodes.length).toBeGreaterThan(0);
    expect(graph.edges.length).toBeGreaterThan(0);

    // Assert correct nodes
    const fileNode = graph.nodes.find((n) => n.type === 'file' && n.id.includes('index.ts'));
    expect(fileNode).toBeDefined();

    const funcNode = graph.nodes.find((n) => n.type === 'function' && n.id.includes('calculateMetrics'));
    expect(funcNode).toBeDefined();

    // Assert correct edges
    const containsEdge = graph.edges.find((e) => e.type === 'contains' && e.target.includes('calculateMetrics'));
    expect(containsEdge).toBeDefined();

    const importEdge = graph.edges.find((e) => e.type === 'import' && e.target.includes('pkg::@pgos'));
    expect(importEdge).toBeDefined();
  });
});
