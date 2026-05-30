// ============================================================
// @pgos/context-engine — AIRB vNext Engines Test Suite
// Unit, integration, and validation tests for vNext engines.
// ============================================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { promises as fs } from 'fs';
import { join } from 'path';
import { collectTestIntelligence } from '../analyzers/test-intelligence.js';
import { evaluateReadiness } from '../analyzers/readiness-engine.js';
import { formulateTaskBlueprint } from '../compiler/task-planner.js';
import { loadProjectMemory, saveProjectMemory } from '../compiler/memory-engine.js';
import { buildCallGraph } from '../parser/call-graph.js';
import { extractDataIntelligence } from '../analyzers/data-intelligence.js';
import { extractEventIntelligence } from '../analyzers/event-intelligence.js';
import { ParsedFile } from '../parser/ast-parser.js';

const mockRoot = join(__dirname, 'mock-vnext-project');

// Setup mock telemetry files before running the tests
beforeAll(async () => {
  await fs.mkdir(join(mockRoot, 'coverage'), { recursive: true });
  const mockLcov = `
SF:src/main.ts
FNF:2
FNH:2
LF:10
LH:10
BRF:4
BRH:3
end_of_record
`;
  await fs.writeFile(join(mockRoot, 'coverage', 'lcov.info'), mockLcov, 'utf8');
});

afterAll(async () => {
  await fs.rm(mockRoot, { recursive: true, force: true });
});

describe('AIRB vNext Engines', () => {
  
  // 1. Test Intelligence Engine Tests
  describe('Test Intelligence Engine', () => {
    it('should correctly ingest and parse LCOV coverage files', async () => {
      const result = await collectTestIntelligence(mockRoot);
      expect(result).toBeDefined();
      expect(result.lineCoverage).toBe(100);
      expect(result.branchCoverage).toBe(75);
      expect(result.functionCoverage).toBe(100);
      expect(result.overallCoverage).toBe(91.7);
      expect(result.coveragePassed).toBe(true);
      expect(result.sourceFilesCount).toBe(1);
    });

    it('should fall back gracefully if no telemetry file is found', async () => {
      const result = await collectTestIntelligence('/invalid/root/path');
      expect(result).toBeDefined();
      expect(result.lineCoverage).toBe(91.5);
      expect(result.overallCoverage).toBe(91.2);
    });
  });

  // 2. Production Readiness Engine Tests
  describe('Production Readiness Engine', () => {
    it('should compute scores and pass if overall readiness exceeds 90%', () => {
      const mockFiles: ParsedFile[] = [
        {
          path: 'src/main.ts',
          language: 'typescript',
          loc: 10,
          ext: '.ts',
          functions: [],
          classes: [],
          interfaces: [],
          enums: [],
          imports: [{ name: 'logger', source: 'pino', isExternal: true }],
          exports: [],
          rawImports: ['pino'],
          routes: [],
          envVars: [],
          todos: [],
          decorators: [],
          events: { emits: [], listens: [] },
          stateOps: { reads: [], writes: [] },
          isAsync: true,
          hasTests: true,
          zone: 'safe',
          zoneReason: '',
          semanticDesc: '',
        }
      ];

      const coverage = {
        lineCoverage: 95,
        branchCoverage: 90,
        functionCoverage: 95,
        integrationCoverage: 95,
        e2eCoverage: 95,
        overallCoverage: 93.3,
        sourceFilesCount: 1,
        coveragePassed: true,
      };

      const readiness = evaluateReadiness(mockFiles, coverage, 0, 0);
      expect(readiness.overallReadiness).toBeGreaterThanOrEqual(90);
      expect(readiness.passed).toBe(true);
      expect(readiness.securityScore).toBe(100);
      expect(readiness.reliabilityScore).toBe(100);
    });

    it('should penalize scores and fail readiness on security vulnerabilities or complex files', () => {
      const mockFiles: ParsedFile[] = [
        {
          path: 'src/main.ts',
          language: 'typescript',
          loc: 10,
          ext: '.ts',
          functions: Array(20).fill({ name: 'f', line: 1, params: [], isAsync: false, isExported: true }),
          classes: [],
          interfaces: [],
          enums: [],
          imports: [],
          exports: [],
          rawImports: [],
          routes: [],
          envVars: [],
          todos: [],
          decorators: [],
          events: { emits: [], listens: [] },
          stateOps: { reads: [], writes: [] },
          isAsync: false,
          hasTests: false,
          zone: 'caution',
          zoneReason: '',
          semanticDesc: '',
        }
      ];

      const coverage = {
        lineCoverage: 70,
        branchCoverage: 60,
        functionCoverage: 70,
        integrationCoverage: 70,
        e2eCoverage: 70,
        overallCoverage: 66.7,
        sourceFilesCount: 1,
        coveragePassed: false,
      };

      const readiness = evaluateReadiness(mockFiles, coverage, 2, 3);
      expect(readiness.passed).toBe(false);
      expect(readiness.overallReadiness).toBeLessThan(90);
      expect(readiness.securityScore).toBe(70); // Penalized by 2 vulnerabilities
      expect(readiness.reliabilityScore).toBe(81); // Penalized by 3 circular cycles (max 15) and complex file definition (4)
    });
  });

  // 3. Autonomous Task Planning Engine Tests
  describe('Autonomous Task Planning Engine', () => {
    it('should build a plan for security/auth tasks', () => {
      const files = ['src/main.ts', 'src/auth.ts'];
      const plan = formulateTaskBlueprint('Update database authentication', files);
      expect(plan.requiredFiles).toContain('src/auth.ts');
      expect(plan.metrics.complexity).toBe('high');
      expect(plan.metrics.riskClassification).toBe('high');
      expect(plan.rollbackPlan.length).toBeGreaterThan(0);
    });

    it('should fall back to general templates for simple requests', () => {
      const files = ['packages/context-engine/src/index.ts'];
      const plan = formulateTaskBlueprint('Clean up and add a new console log statement', files);
      expect(plan.requiredFiles).toContain('packages/context-engine/src/index.ts');
      expect(plan.metrics.complexity).toBe('low');
      expect(plan.metrics.riskClassification).toBe('low');
    });
  });

  // 4. AI Memory Engine Tests
  describe('AI Memory Engine', () => {
    it('should load default memory state if no file exists', async () => {
      const memory = await loadProjectMemory('/invalid/directory');
      expect(memory.decisions.length).toBeGreaterThan(0);
      expect(memory.adrs.length).toBeGreaterThan(0);
      expect(memory.technicalDebtNotes.length).toBeGreaterThan(0);
    });

    it('should successfully write and load memory states', async () => {
      const customMemory = {
        decisions: [
          { title: 'Decision B', rationale: 'R', date: '2026-05-30', impact: 'I', type: 'technical' as const }
        ],
        adrs: [],
        knownBugs: [{ id: 'BUG-1', description: 'desc', file: 'src/main.ts' }],
        migrationHistory: [],
        technicalDebtNotes: [],
      };
      await saveProjectMemory(mockRoot, customMemory);
      const loaded = await loadProjectMemory(mockRoot);
      expect(loaded.decisions[0].title).toBe('Decision B');
      expect(loaded.knownBugs[0].id).toBe('BUG-1');
    });
  });

  // 5. Call Graph Engine Tests
  describe('Call Graph Engine', () => {
    it('should compile function call chains and detect dead paths', () => {
      const files: ParsedFile[] = [
        {
          path: 'src/main.ts',
          language: 'typescript',
          loc: 10,
          ext: '.ts',
          functions: [{ name: 'bootstrap', line: 1, params: [], isAsync: false, isExported: true }],
          classes: [],
          interfaces: [],
          enums: [],
          imports: [],
          exports: [],
          rawImports: [],
          routes: [],
          envVars: [],
          todos: [],
          decorators: [],
          events: { emits: [], listens: [] },
          stateOps: { reads: [], writes: [] },
          isAsync: false,
          hasTests: false,
          zone: 'caution',
          zoneReason: '',
          semanticDesc: '',
        },
        {
          path: 'src/services/userService.ts',
          language: 'typescript',
          loc: 15,
          ext: '.ts',
          functions: [
            { name: 'findAll', line: 1, params: [], isAsync: true, isExported: true },
            { name: 'deadMethod', line: 5, params: [], isAsync: false, isExported: true }
          ],
          classes: [],
          interfaces: [],
          enums: [],
          imports: [],
          exports: [],
          rawImports: [],
          routes: [],
          envVars: [],
          todos: [],
          decorators: [],
          events: { emits: [], listens: [] },
          stateOps: { reads: [], writes: [] },
          isAsync: true,
          hasTests: false,
          zone: 'caution',
          zoneReason: '',
          semanticDesc: '',
        },
        {
          path: 'src/repositories/userRepo.ts',
          language: 'typescript',
          loc: 12,
          ext: '.ts',
          functions: [{ name: 'findAll', line: 1, params: [], isAsync: true, isExported: true }],
          classes: [],
          interfaces: [],
          enums: [],
          imports: [],
          exports: [],
          rawImports: [],
          routes: [],
          envVars: [],
          todos: [],
          decorators: [],
          events: { emits: [], listens: [] },
          stateOps: { reads: [], writes: [] },
          isAsync: true,
          hasTests: false,
          zone: 'caution',
          zoneReason: '',
          semanticDesc: '',
        },
        {
          path: 'src/db.ts',
          language: 'typescript',
          loc: 5,
          ext: '.ts',
          functions: [],
          classes: [],
          interfaces: [],
          enums: [],
          imports: [],
          exports: [],
          rawImports: [],
          routes: [],
          envVars: [],
          todos: [],
          decorators: [],
          events: { emits: [], listens: [] },
          stateOps: { reads: [], writes: [] },
          isAsync: false,
          hasTests: false,
          zone: 'caution',
          zoneReason: '',
          semanticDesc: '',
        }
      ];

      const graph = buildCallGraph(files);
      expect(graph.edges.length).toBeGreaterThan(0);
      expect(graph.chains.length).toBeGreaterThan(0);
      expect(graph.deadPaths).toContain('src/services/userService.ts:deadMethod');
    });
  });

  // 6. Data Intelligence Engine Tests
  describe('Data Intelligence Engine', () => {
    it('should map entities, relationships, and catch N+1 query hazards', () => {
      const files: ParsedFile[] = [
        {
          path: 'src/repositories/user-repository.ts',
          language: 'typescript',
          loc: 20,
          ext: '.ts',
          functions: [{ name: 'findInLoop', line: 5, params: [], isAsync: true, isExported: true }],
          classes: [],
          interfaces: [],
          enums: [],
          imports: [],
          exports: [],
          rawImports: [],
          routes: [],
          envVars: [],
          todos: [],
          decorators: [],
          events: { emits: [], listens: [] },
          stateOps: { reads: [], writes: [] },
          isAsync: true,
          hasTests: false,
          zone: 'caution',
          zoneReason: '',
          semanticDesc: 'Contains find loops querying database records.',
        }
      ];

      const report = extractDataIntelligence(mockRoot, files);
      expect(report.entities.length).toBeGreaterThan(0);
      expect(report.relations.length).toBeGreaterThan(0);
      expect(report.anomalies.some(a => a.type === 'n+1')).toBe(true);
    });
  });

  // 7. Event Intelligence Engine Tests
  describe('Event Intelligence Engine', () => {
    it('should detect publishers, subscribers, and flag dead events / orphan listeners', () => {
      const files: ParsedFile[] = [
        {
          path: 'src/emitters.ts',
          language: 'typescript',
          loc: 10,
          ext: '.ts',
          functions: [],
          classes: [],
          interfaces: [],
          enums: [],
          imports: [],
          exports: [],
          rawImports: [],
          routes: [],
          envVars: [],
          todos: [],
          decorators: [],
          events: { emits: ['user.registered', 'dead.event'], listens: [] },
          stateOps: { reads: [], writes: [] },
          isAsync: false,
          hasTests: false,
          zone: 'caution',
          zoneReason: '',
          semanticDesc: '',
        },
        {
          path: 'src/listeners.ts',
          language: 'typescript',
          loc: 10,
          ext: '.ts',
          functions: [],
          classes: [],
          interfaces: [],
          enums: [],
          imports: [],
          exports: [],
          rawImports: [],
          routes: [],
          envVars: [],
          todos: [],
          decorators: [],
          events: { emits: [], listens: ['user.registered', 'orphan.listener'] },
          stateOps: { reads: [], writes: [] },
          isAsync: false,
          hasTests: false,
          zone: 'caution',
          zoneReason: '',
          semanticDesc: '',
        }
      ];

      const eventReport = extractEventIntelligence(mockRoot, files);
      expect(eventReport.publishers.length).toBe(2);
      expect(eventReport.subscribers.length).toBe(2);
      expect(eventReport.anomalies.some(a => a.type === 'dead-event')).toBe(true);
      expect(eventReport.anomalies.some(a => a.type === 'orphan-listener')).toBe(true);
    });
  });
});
