import { describe, it, expect, afterAll } from 'vitest';
import { TechnicalWriter, DiagramGenerator, RequirementEngine, DocValidator, DocOrchestrator, KnowledgeBase, SelfImprovementEngine, FeatureDiscoveryEngine } from '../index.js';
import type { CodebaseStats } from '../index.js';
import { join, dirname } from 'path';
import { mkdir, writeFile, readFile, rm } from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('PGOS Documentation OS Core Suite', () => {
  const mockRoot = join(__dirname, 'mock-project-docs');

  afterAll(async () => {
    await rm(mockRoot, { recursive: true, force: true });
  });

  it('should synthesize context diagrams from real stats', () => {
    const stats: CodebaseStats = {
      modules: [
        { name: 'core', purpose: 'library module', path: 'packages/core', dependencies: [], publicApi: ['sha256', 'log'] },
        { name: 'cli', purpose: 'cli module', path: 'apps/cli', dependencies: ['core'], publicApi: ['run'] },
      ],
      totalLOC: 1500,
      fileCount: 20,
      languages: ['typescript'],
      dependencies: ['vitest'],
      criticalFiles: ['packages/core/src/index.ts'],
      mermaidC4: '',
      mermaidContext: '',
      dirTree: '',
    };

    const context = DiagramGenerator.generateSystemContext(stats);
    const c4 = DiagramGenerator.generateC4Container(stats);

    // Real stats-based diagrams should contain actual module names
    expect(context).toContain('core');
    expect(context).toContain('cli');
    expect(context).toContain('-->');
    expect(c4).toContain('core');
    expect(c4).toContain('Layer');
  });

  it('should generate basic diagrams when no stats provided', () => {
    const context = DiagramGenerator.generateSystemContext();
    const c4 = DiagramGenerator.generateC4Container();

    expect(context).toContain('User');
    expect(c4).toContain('graph TB');
  });

  it('should build requirement tree from real project scan', async () => {
    await mkdir(join(mockRoot, 'src'), { recursive: true });
    await writeFile(join(mockRoot, 'src', 'feature.ts'), 'export function hello() { return "hi"; }');
    await writeFile(join(mockRoot, 'package.json'), JSON.stringify({ name: 'mock-app' }));

    const tree = await RequirementEngine.buildTree(mockRoot);
    expect(tree).toBeDefined();
    expect(tree.type).toBe('vision');
    expect(typeof tree.coverage).toBe('number');
  });

  it('should return default tree when no root path provided', async () => {
    const tree = await RequirementEngine.buildTree();
    expect(tree.coverage).toBe(0);
    expect(tree.children.length).toBe(0);
  });

  it('should compute real coverage score', async () => {
    const score = await RequirementEngine.getRequirementCoverageScore(mockRoot);
    expect(typeof score).toBe('number');
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('should audit stubs and placeholders and compute doc coverage scores', () => {
    const docs = ['docs/requirements/PRD.md', 'docs/technical/LLD-TODO.md'];
    const report = DocValidator.validateDocumentation(docs);

    expect(report.overallScore).toBe(50);
    expect(report.placeholderCount).toBe(1);
    expect(report.staleDocs).toContain('docs/technical/LLD-TODO.md');
  });

  it('should detect draft docs as stale', () => {
    const docs = ['docs/draft-api.md', 'docs/final-spec.md'];
    const report = DocValidator.validateDocumentation(docs);

    expect(report.placeholderCount).toBe(1);
    expect(report.staleDocs).toContain('docs/draft-api.md');
  });

  it('should dynamically scan a project workspace and compile custom codebase specifications', async () => {
    await mkdir(mockRoot, { recursive: true });

    // Scaffold mock package files
    const codeContent = `
import { logger } from '@pgos/core';
export function runWorkerProcess(): string {
  return 'worker-active';
}
`;
    await mkdir(join(mockRoot, 'src'), { recursive: true });
    await writeFile(join(mockRoot, 'src', 'main.ts'), codeContent);
    await writeFile(join(mockRoot, 'package.json'), JSON.stringify({ name: 'mock-app' }));

    // Run the dynamic orchestrator
    await DocOrchestrator.handleCodeChange(mockRoot);

    // Verify files were generated
    const visionPath = join(mockRoot, 'docs', '00-executive', 'vision.md');
    const prdPath = join(mockRoot, 'docs', '01-product', 'PRD.md');
    const hldPath = join(mockRoot, 'docs', '02-architecture', 'HLD.md');
    const foldersPath = join(mockRoot, 'docs', '03-engineering', 'folder-structure.md');

    const visionText = await readFile(visionPath, 'utf-8');
    const prdText = await readFile(prdPath, 'utf-8');
    const hldText = await readFile(hldPath, 'utf-8');
    const foldersText = await readFile(foldersPath, 'utf-8');

    // Assert that the generated documents contain custom, codebase-aware metrics!
    expect(visionText).toContain('Active Technical Stack');
    expect(visionText).toContain('typescript');
    expect(prdText).toContain('High-Connectivity');
    expect(hldText).toContain('System Context Graph');
    expect(hldText).toContain('mermaid');
    expect(foldersText).toContain('Project Folder Structure');
  });

  it('should save decisions using KnowledgeBase', async () => {
    await KnowledgeBase.saveDecision(mockRoot, 'Test ADR', 'Context of ADR', 'Rationale of ADR');
    const adrDir = join(mockRoot, '.guardian', 'knowledge', 'decisions');

    const fs = await import('fs/promises');
    const files = await fs.readdir(adrDir);
    expect(files.length).toBeGreaterThanOrEqual(1);
    expect(files[0]).toContain('ADR-');

    const content = await fs.readFile(join(adrDir, files[0]), 'utf-8');
    expect(content).toContain('Test ADR');
    expect(content).toContain('Rationale of ADR');
  });

  it('should propose real improvements using SelfImprovementEngine', async () => {
    // Create a source file with issues
    const badCode = `
export function badFunc() {
  // TODO: implement this
  try {
    // something
  } catch (e) {}
  // FIXME: broken
}
`;
    await mkdir(join(mockRoot, 'src'), { recursive: true });
    await writeFile(join(mockRoot, 'src', 'bad.ts'), badCode);

    const outputPath = join(mockRoot, 'enhancements.md');
    const content = await SelfImprovementEngine.proposeImprovements(outputPath, mockRoot);

    expect(content).toContain('Project Enhancements');
    // Should detect real issues from the bad code
    expect(content).toContain('TODO');
    const fileContent = await readFile(outputPath, 'utf-8');
    expect(fileContent.length).toBeGreaterThan(50);
  });

  it('should discover features based on real codebase analysis', async () => {
    const features = await FeatureDiscoveryEngine.discoverFutureFeatures(mockRoot);
    expect(features.length).toBeGreaterThan(0);
    // Should find real missing features (no CI/CD, no Docker, etc.)
    expect(features.some(f => f.includes('CI/CD') || f.includes('Docker') || f.includes('linting') || f.includes('good infrastructure'))).toBe(true);
  });

  it('should return guidance when no root path provided to FeatureDiscoveryEngine', async () => {
    const features = await FeatureDiscoveryEngine.discoverFutureFeatures();
    expect(features.length).toBe(1);
    expect(features[0]).toContain('project root path');
  });
});
