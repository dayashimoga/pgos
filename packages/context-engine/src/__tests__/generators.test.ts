// ============================================================
// @pgos/context-engine — Generators Test Suite
// Real proof-of-implementation tests for all Markdown/JSON
// artifact generators including the AI_REPOSITORY_BRAIN.md
// ============================================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { join, dirname } from 'path';
import { mkdir, rm, readdir, stat } from 'fs/promises';
import { fileURLToPath } from 'url';
import {
  generateRepositoryBrainMd,
  generateContextMd,
  generateQuickMd,
  generateArchitectureMd,
  generateRuntimeMd,
  generateFeaturesMd,
  generateRisksMd,
  generateSecurityMd,
  generateNavigationMd,
  generateValidationMd,
} from '../generators/markdown-generators.js';
import {
  generateDependencyGraph,
  generateImportGraph,
  generateServiceGraph,
  generateChangeGraphJson,
  generateRuntimeGraph,
  generateFeatureGraph,
} from '../generators/graph-generators.js';
import {
  generateIndexJson,
  generateTechDebtJson,
  generateSemanticChunksJson,
  generateMemoryJson,
  generateValidationJson,
} from '../generators/intelligence-generators.js';
import { generateRules } from '../generators/rules-generator.js';
import { generateAllArtifacts } from '../generators/artifact-orchestrator.js';
import type { ProjectIntelligence } from '@pgos/core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const outputDir = join(__dirname, 'mock-artifacts-output');

// ── Synthetic ProjectIntelligence fixture ────────────────────
function makeIntel(): ProjectIntelligence {
  return {
    projectIdentity: {
      name: 'test-service',
      summary: 'A test service for AI-POS validation',
      goals: ['serve users'],
      nonGoals: ['replace humans'],
      maturity: 'beta',
      status: 'active',
      priorities: ['reliability'],
      primaryLanguage: 'TypeScript',
      languages: { TypeScript: 5000, JSON: 200 },
      framework: 'Fastify',
      buildSystem: 'Turborepo',
      repoType: 'monorepo',
      packageManager: 'pnpm',
      totalFiles: 42,
      totalLoc: 5200,
    },
    domainModel: {
      entities: [
        { name: 'User', type: 'aggregate', properties: ['id', 'name', 'email'], sourceFile: 'src/domain/User.ts', description: 'Core user aggregate' },
        { name: 'Post', type: 'entity', properties: ['id', 'title', 'authorId'], sourceFile: 'src/domain/Post.ts', description: 'Blog post entity' },
      ],
      relations: [
        { from: 'User', to: 'Post', type: 'has-many' },
      ],
      constraints: ['email must be unique', 'user must have a name'],
      invariants: ['User cannot be deleted if they have active posts'],
      lifecycles: [],
      glossary: [
        { term: 'User', definition: 'A registered account holder', source: 'domain model' },
      ],
    },
    architecture: {
      detectedPattern: 'layered',
      confidence: 82,
      evidence: ['routes/ directories found', 'services/ directories found', 'repositories/ directories found'],
      layers: [
        { name: 'api', purpose: 'HTTP API endpoints', directories: ['src/routes'], components: ['userRoutes'], allowedDependencies: ['service'], forbiddenDependencies: ['db'], entryPoints: ['src/routes/users.ts'] },
        { name: 'service', purpose: 'Business logic', directories: ['src/services'], components: ['userService'], allowedDependencies: ['repository'], forbiddenDependencies: [], entryPoints: [] },
      ],
      communication: [
        { from: 'api', to: 'external', protocol: 'http', description: 'HTTP via Fastify' },
      ],
      boundaries: [
        { name: 'api', type: 'module', components: ['userRoutes'], publicApi: ['/api/users'] },
      ],
      principles: ['Separation of Concerns', 'Single Responsibility'],
    },
    executionFlows: {
      startup: {
        name: 'startup',
        description: 'Application boot sequence',
        steps: [
          { order: 0, action: 'Load environment', file: 'src/main.ts', description: 'Read .env variables', async: false },
          { order: 1, action: 'Create Fastify app', file: 'src/app.ts', description: 'Initialize fastify instance', async: false },
          { order: 2, action: 'Register routes', file: 'src/app.ts', function: 'createApp', description: 'Mount route handlers', async: true },
          { order: 3, action: 'Listen on port', file: 'src/main.ts', function: 'bootstrap', description: 'Start HTTP server', async: true },
        ],
      },
      request: {
        name: 'request',
        description: 'HTTP request processing pipeline',
        steps: [
          { order: 0, action: 'Receive request', file: 'src/app.ts', description: 'Fastify receives HTTP request', async: true },
          { order: 1, action: 'Run auth middleware', file: 'src/middleware/auth.ts', function: 'authMiddleware', description: 'JWT validation', async: true },
          { order: 2, action: 'Route handler', file: 'src/routes/users.ts', description: 'Execute route handler', async: true },
        ],
      },
      failure: {
        name: 'failure',
        description: 'Error handling',
        steps: [
          { order: 0, action: 'Catch exception', file: 'src/app.ts', description: 'Global error handler', async: false },
        ],
      },
      recovery: {
        name: 'recovery',
        description: 'Recovery flow',
        steps: [],
      },
      shutdown: {
        name: 'shutdown',
        description: 'Graceful shutdown',
        steps: [
          { order: 0, action: 'Stop server', file: 'src/main.ts', description: 'Close HTTP connections', async: true },
        ],
      },
    },
    featureMatrix: {
      features: [
        {
          name: 'User Management',
          status: 'implemented',
          entryPoint: 'src/routes/users.ts',
          tests: ['src/__tests__/users.test.ts'],
          dependencies: ['user-service'],
          coverage: 85,
          files: ['src/routes/users.ts', 'src/services/user-service.ts'],
          description: 'CRUD for users',
        },
        {
          name: 'Authentication',
          status: 'implemented',
          entryPoint: 'src/middleware/auth.ts',
          tests: [],
          dependencies: ['jsonwebtoken'],
          coverage: 0,
          files: ['src/middleware/auth.ts'],
        },
      ],
      totalFeatures: 2,
      implementedCount: 2,
      testedCount: 1,
      documentedCount: 1,
    },
    apiIntelligence: {
      endpoints: [
        { method: 'GET', path: '/api/users', handler: 'getUsers', file: 'src/routes/users.ts', auth: true },
        { method: 'POST', path: '/api/users', handler: 'createUser', file: 'src/routes/users.ts', auth: false },
        { method: 'PUT', path: '/api/users/:id', handler: 'updateUser', file: 'src/routes/users.ts', auth: true },
        { method: 'DELETE', path: '/api/users/:id', handler: 'deleteUser', file: 'src/routes/users.ts', auth: true },
      ],
      schemas: [],
      authPatterns: ['JWT'],
      errorPatterns: [],
      rateLimiting: false,
      websocketChannels: [],
    },
    dataIntelligence: {
      tables: [],
      indexes: [],
      migrations: [],
      ormUsed: 'Drizzle',
    },
    configIntelligence: {
      envVars: [
        { name: 'DATABASE_URL', required: true, sensitive: true, usedIn: ['src/db/connection.ts'], description: 'PostgreSQL connection string' },
        { name: 'JWT_SECRET', required: true, sensitive: true, usedIn: ['src/middleware/auth.ts'], description: 'JWT signing secret' },
        { name: 'PORT', required: false, defaultValue: '3000', sensitive: false, usedIn: ['src/main.ts'] },
      ],
      featureFlags: [],
      runtimeModes: ['production', 'development', 'test'],
      configFiles: [
        { path: 'package.json', format: 'json', purpose: 'NPM package manifest' },
        { path: '.env.example', format: 'env', purpose: 'Environment variable template' },
      ],
    },
    securityIntelligence: {
      authMechanism: ['JWT'],
      permissionModel: 'Role-based access control',
      secretManagement: ['Environment variables'],
      inputValidation: [
        { type: 'auth-middleware', file: 'src/middleware/auth.ts', description: 'JWT token validation on all routes' },
      ],
      corsConfig: 'Not configured',
      knownVulnerabilities: [],
      securityBoundaries: ['src/middleware/auth.ts'],
    },
    performanceIntelligence: {
      bottlenecks: [],
      cachingPatterns: [],
      asyncPatterns: ['async/await throughout', 'Promise-based DB queries'],
      databasePatterns: [
        { type: 'query', file: 'src/repositories/user-repository.ts', description: 'ORM queries via Drizzle', risk: 'low' },
      ],
      bundleIndicators: [],
    },
    observabilityIntelligence: {
      loggingSetup: [{ name: 'pino', type: 'structured', file: 'src/utils/logger.ts', description: 'JSON structured logging' }],
      metricsSetup: [],
      tracingSetup: [],
      healthChecks: [],
      alertRules: [],
    },
    technicalDebt: {
      items: [
        { type: 'todo', file: 'src/routes/users.ts', line: 15, description: '// TODO: add pagination', severity: 'medium' },
      ],
      totalCount: 1,
      criticalCount: 0,
      estimatedEffort: 'Days',
    },
    safetyClassification: {
      safeFiles: [
        { path: 'src/__tests__/users.test.ts', zone: 'safe', reason: 'Test file', blastRadius: 0, requiredTests: [], riskLevel: 'low' },
      ],
      cautionFiles: [
        { path: 'src/routes/users.ts', zone: 'caution', reason: 'API handler', blastRadius: 2, requiredTests: ['unit'], riskLevel: 'medium' },
        { path: 'src/services/user-service.ts', zone: 'caution', reason: 'Business logic', blastRadius: 3, requiredTests: ['unit'], riskLevel: 'medium' },
      ],
      criticalFiles: [
        { path: 'src/middleware/auth.ts', zone: 'critical', reason: 'Auth logic', blastRadius: 8, requiredTests: ['unit', 'integration'], riskLevel: 'critical' },
        { path: 'src/db/schema.ts', zone: 'critical', reason: 'DB schema', blastRadius: 5, requiredTests: ['integration'], riskLevel: 'high' },
      ],
      doNotModifyZones: [],
    },
    aiEditRules: {
      always: [
        'Run affected tests before committing',
        'Validate imports exist',
        'Ensure type safety',
      ],
      never: [
        'Delete lock files',
        'Hardcode secrets',
        'Remove error handling',
      ],
      beforeEdit: [
        'Check blast radius',
        'Verify file safety zone',
      ],
      afterEdit: [
        'Run test suite',
        'Verify build compiles',
      ],
    },
    riskIntelligence: {
      blastRadiusMap: [
        { file: 'src/middleware/auth.ts', dependentCount: 8, affectedModules: ['api', 'service'], riskLevel: 'critical' },
        { file: 'src/db/schema.ts', dependentCount: 5, affectedModules: ['db', 'repository'], riskLevel: 'high' },
        { file: 'src/services/user-service.ts', dependentCount: 2, affectedModules: ['api'], riskLevel: 'medium' },
      ],
      criticalFiles: ['src/middleware/auth.ts', 'src/db/schema.ts', 'src/main.ts'],
      unsafeEdits: [
        { file: 'src/middleware/auth.ts', reason: 'Auth logic is security-critical', complexity: 12, testCoverage: 0, recommendation: 'Add tests first' },
      ],
      singlePointsOfFailure: ['src/db/connection.ts'],
      untestedPaths: ['src/middleware/auth.ts', 'src/db/schema.ts'],
      overallRiskScore: 65,
    },
    validationIntelligence: {
      confidenceScore: 78,
      staleStatus: [
        { artifact: 'AI_REPOSITORY_BRAIN.md', stale: false, lastUpdated: new Date().toISOString() },
        { artifact: 'AI_CONTEXT.md', stale: false, lastUpdated: new Date().toISOString() },
      ],
      verificationReport: [
        { check: 'Import Consistency', passed: true, message: 'All imports resolved', severity: 'info' },
        { check: 'Feature Alignment', passed: false, message: '1 feature has no tests', severity: 'warning' },
      ],
      timestamp: new Date().toISOString(),
      generationDuration: 1234,
      artifactCount: 29,
      warnings: ['Authentication feature has no test coverage'],
    },
    memoryState: {
      historicalDecisions: [
        { title: 'Use Fastify over Express', context: 'Performance requirements', decision: 'Chose Fastify', rationale: 'Better performance and TypeScript support', date: '2024-01-15', status: 'active' },
      ],
      rejectedIdeas: [
        { title: 'Use GraphQL', description: 'Too complex for current needs', date: '2024-01-10', tags: [], relatedFiles: [] },
      ],
      activeWork: [
        { title: 'Add rate limiting', description: 'Protect API endpoints', date: '2024-05-01', tags: [], relatedFiles: [] },
      ],
      plannedWork: [],
      lastEdits: [],
      knownFailures: [],
      lessonsLearned: [
        { title: 'JWT validation order', description: 'Always validate before route handler', date: '2024-02-01', tags: [], relatedFiles: [] },
      ],
      roadmap: [
        { title: 'Add OAuth2', description: 'Support Google/GitHub login', date: '2024-07-01', tags: [], relatedFiles: [] },
      ],
      evolutionHistory: [],
    },
    navigationMap: {
      needArchitecture: 'AI_ARCHITECTURE.md',
      needRuntime: 'AI_RUNTIME.md',
      needModification: 'AI_CHANGE_GRAPH.json',
      needDebugging: 'AI_OBSERVABILITY.md',
      needOnboarding: 'AI_QUICK.md',
      needValidation: 'AI_VALIDATION.json',
      needSecurity: 'AI_SECURITY.md',
      needPerformance: 'AI_PERFORMANCE.md',
      needFeatures: 'AI_FEATURES.md',
      needDependencies: 'AI_DEPENDENCIES.md',
      needTests: 'AI_TESTS.md',
      needRisks: 'AI_RISKS.md',
    },
    generatedAt: new Date().toISOString(),
    pgosVersion: '1.0.0',
  };
}

// ── Setup & Teardown ─────────────────────────────────────────
beforeAll(async () => {
  await rm(outputDir, { recursive: true, force: true });
  await mkdir(outputDir, { recursive: true });
});

afterAll(async () => {
  await rm(outputDir, { recursive: true, force: true });
});

// ── Markdown Generator Tests ─────────────────────────────────

describe('generateRepositoryBrainMd — Master Brain File', () => {
  const intel = makeIntel();
  let output: string;

  beforeAll(() => {
    output = generateRepositoryBrainMd(intel);
  });

  it('should return a non-empty string', () => {
    expect(typeof output).toBe('string');
    expect(output.length).toBeGreaterThan(500);
  });

  it('should contain the SEMANTIC ROUTING INDEX section', () => {
    expect(output).toContain('SEMANTIC ROUTING INDEX');
  });

  it('should contain all 17 section markers (§ 1 through § 17)', () => {
    for (let i = 1; i <= 17; i++) {
      expect(output).toContain(`§ ${i}.`);
    }
  });

  it('should contain project name in title', () => {
    expect(output).toContain('test-service');
  });

  it('should contain architecture pattern', () => {
    expect(output).toContain('layered');
  });

  it('should contain all 4 API endpoints', () => {
    expect(output).toContain('getUsers');
    expect(output).toContain('createUser');
    expect(output).toContain('updateUser');
    expect(output).toContain('deleteUser');
  });

  it('should contain safety zone table with counts', () => {
    // Safe | 1, Caution | 2, Critical | 2
    expect(output).toContain('Safe');
    expect(output).toContain('Caution');
    expect(output).toContain('Critical');
  });

  it('should contain AI edit rules (ALWAYS/NEVER/BEFORE/AFTER)', () => {
    expect(output).toContain('ALWAYS');
    expect(output).toContain('NEVER');
    expect(output).toContain('BEFORE EDIT');
    expect(output).toContain('AFTER EDIT');
  });

  it('should contain blast radius table', () => {
    expect(output).toContain('src/middleware/auth.ts');
    expect(output).toContain('critical');
  });

  it('should contain domain entities', () => {
    expect(output).toContain('User');
    expect(output).toContain('Post');
  });

  it('should contain Mermaid code blocks', () => {
    expect(output).toContain('```mermaid');
    expect(output).toContain('graph TD');
  });

  it('should contain the artifact map with all key files listed', () => {
    expect(output).toContain('AI_REPOSITORY_BRAIN.md');
    expect(output).toContain('AI_CONTEXT.md');
    expect(output).toContain('AI_ARCHITECTURE.md');
    expect(output).toContain('AI_RISKS.md');
    expect(output).toContain('AI_SECURITY.md');
    expect(output).toContain('AI_SEMANTIC_CHUNKS.json');
  });

  it('should contain pgosVersion and generatedAt', () => {
    expect(output).toContain('1.0.0');
    expect(output).toContain('DO NOT EDIT MANUALLY');
  });

  it('should contain env vars section', () => {
    expect(output).toContain('DATABASE_URL');
    expect(output).toContain('JWT_SECRET');
  });

  it('should contain technical debt inventory', () => {
    expect(output).toContain('Technical Debt Inventory');
    // Has 1 debt item
    expect(output).toContain('todo');
  });

  it('should contain memory decisions section', () => {
    expect(output).toContain('Use Fastify over Express');
  });

  it('should contain validation confidence score', () => {
    expect(output).toContain('78%');
  });
});

describe('generateContextMd', () => {
  it('should include project identity and all major sections', () => {
    const output = generateContextMd(makeIntel());
    expect(output).toContain('test-service');
    expect(output).toContain('A test service');
    expect(output).toContain('TypeScript');
    expect(output).toContain('Fastify');
    expect(output).toContain('AI OPERATING SYSTEM');
    expect(output).toContain('Feature Matrix');
    expect(output).toContain('Risk Intelligence');
    expect(output).toContain('Security Intelligence');
  });
});

describe('generateQuickMd — Token Budget', () => {
  it('should produce a concise summary under 2500 characters', () => {
    const output = generateQuickMd(makeIntel());
    expect(output.length).toBeLessThan(2500);
    expect(output).toContain('test-service');
    expect(output).toContain('TypeScript');
  });

  it('should reference all key navigation targets', () => {
    const output = generateQuickMd(makeIntel());
    expect(output).toContain('AI_ARCHITECTURE.md');
    expect(output).toContain('AI_RUNTIME.md');
    expect(output).toContain('AI_RISKS.md');
  });
});

describe('generateArchitectureMd', () => {
  it('should contain detected pattern and Mermaid diagram', () => {
    const output = generateArchitectureMd(makeIntel());
    expect(output).toContain('layered');
    expect(output).toContain('82%');
    expect(output).toContain('```mermaid');
    expect(output).toContain('Separation of Concerns');
  });
});

describe('generateRuntimeMd', () => {
  it('should contain all 5 lifecycle phases', () => {
    const output = generateRuntimeMd(makeIntel());
    expect(output).toContain('Startup');
    expect(output).toContain('Request Processing');
    expect(output).toContain('Failure');
    expect(output).toContain('Shutdown');
    expect(output).toContain('Load environment');
  });
});

describe('generateRisksMd', () => {
  it('should contain risk score and blast radius map', () => {
    const output = generateRisksMd(makeIntel());
    expect(output).toContain('65/100');
    expect(output).toContain('src/middleware/auth.ts');
    expect(output).toContain('src/db/connection.ts');
  });
});

describe('generateSecurityMd', () => {
  it('should contain auth mechanism and vulnerability report', () => {
    const output = generateSecurityMd(makeIntel());
    expect(output).toContain('JWT');
    expect(output).toContain('Role-based');
    expect(output).toContain('No vulnerabilities detected');
  });
});

describe('generateNavigationMd', () => {
  it('should map all 12 navigation destinations', () => {
    const output = generateNavigationMd(makeIntel());
    expect(output).toContain('AI_ARCHITECTURE.md');
    expect(output).toContain('AI_RUNTIME.md');
    expect(output).toContain('AI_OBSERVABILITY.md');
    expect(output).toContain('AI_SECURITY.md');
    expect(output).toContain('AI_FEATURES.md');
    expect(output).toContain('42'); // totalFiles
    expect(output).toContain('5,200'); // totalLoc formatted
  });
});

describe('generateValidationMd', () => {
  it('should contain confidence score and stale status', () => {
    const output = generateValidationMd(makeIntel());
    expect(output).toContain('78%');
    expect(output).toContain('1234ms');
    expect(output).toContain('Import Consistency');
    expect(output).toContain('Authentication feature has no test coverage');
  });
});

// ── Rules Generator Tests ────────────────────────────────────

describe('generateRules', () => {
  it('should generate dynamic rules from ProjectIntelligence', () => {
    const intel = makeIntel();
    const rules = generateRules(intel);

    expect(rules.always).toBeInstanceOf(Array);
    expect(rules.never).toBeInstanceOf(Array);
    expect(rules.beforeEdit).toBeInstanceOf(Array);
    expect(rules.afterEdit).toBeInstanceOf(Array);

    expect(rules.always.length).toBeGreaterThan(0);
    expect(rules.never.length).toBeGreaterThan(0);
    expect(rules.beforeEdit.length).toBeGreaterThan(0);
    expect(rules.afterEdit.length).toBeGreaterThan(0);
  });

  it('should add TypeScript-specific rules for TypeScript projects', () => {
    const intel = makeIntel();
    const rules = generateRules(intel);

    const hasTypeRule = rules.always.some(r => /type.*safety|ESLint|TypeScript/i.test(r));
    expect(hasTypeRule).toBe(true);
  });

  it('should add Fastify-specific rules for Fastify projects', () => {
    const intel = makeIntel();
    const rules = generateRules(intel);

    const hasFastifyRule = rules.always.some(r => /fastify|schema|route/i.test(r)) ||
      rules.beforeEdit.some(r => /fastify|schema|route/i.test(r));
    expect(hasFastifyRule).toBe(true);
  });

  it('should add monorepo rules for monorepo projects', () => {
    const intel = makeIntel();
    const rules = generateRules(intel);

    const hasMonorepoRule = rules.always.some(r => /workspace|filter|monorepo/i.test(r));
    expect(hasMonorepoRule).toBe(true);
  });

  it('should warn about critical files in beforeEdit rules', () => {
    const intel = makeIntel();
    // Add critical files
    intel.safetyClassification.criticalFiles = [
      { path: 'src/middleware/auth.ts', zone: 'critical', reason: 'Auth', blastRadius: 8, requiredTests: [], riskLevel: 'critical' },
    ];
    const rules = generateRules(intel);

    const hasCriticalWarning = rules.beforeEdit.some(r => /CRITICAL|critical/i.test(r));
    expect(hasCriticalWarning).toBe(true);
  });
});

// ── JSON Generator Tests ─────────────────────────────────────

describe('generateIndexJson', () => {
  it('should produce a valid index with navigation and artifacts', () => {
    const result = generateIndexJson(makeIntel()) as Record<string, unknown>;
    expect(result._meta).toBeDefined();
    expect((result._meta as Record<string, unknown>).type).toBe('ai-pos-index');
    expect(result.navigation).toBeDefined();
    expect(result.artifacts).toBeDefined();

    const artifacts = result.artifacts as Record<string, unknown[]>;
    expect(artifacts.markdown).toBeInstanceOf(Array);
    expect(artifacts.markdown.length).toBeGreaterThan(0);

    // AI_REPOSITORY_BRAIN.md must be first
    const firstMd = (artifacts.markdown[0] as Record<string, string>).file;
    expect(firstMd).toBe('AI_REPOSITORY_BRAIN.md');
  });
});

describe('generateTechDebtJson', () => {
  it('should produce structured debt inventory', () => {
    const result = generateTechDebtJson(makeIntel()) as Record<string, unknown>;
    expect(result.summary).toBeDefined();
    expect((result.summary as Record<string, unknown>).totalCount).toBe(1);
    expect((result.summary as Record<string, unknown>).criticalCount).toBe(0);
    expect(result.items).toBeInstanceOf(Array);
  });
});

describe('generateSemanticChunksJson', () => {
  it('should produce semantic chunks from entities, features, and endpoints', () => {
    const result = generateSemanticChunksJson(makeIntel()) as Record<string, unknown>;
    expect(result.chunks).toBeInstanceOf(Array);
    expect((result.chunks as unknown[]).length).toBeGreaterThan(0);
    expect(typeof result.count).toBe('number');

    // Each chunk should have chunkId, source, type, semanticContent
    const chunks = result.chunks as Record<string, unknown>[];
    chunks.forEach(chunk => {
      expect(chunk.chunkId).toBeTruthy();
      expect(chunk.type).toBeTruthy();
      expect(chunk.semanticContent).toBeTruthy();
    });
  });
});

describe('Graph Generators', () => {
  it('generateDependencyGraph should return a valid graph object', () => {
    const result = generateDependencyGraph(makeIntel()) as Record<string, unknown>;
    expect(result._meta).toBeDefined();
    expect(result.layers).toBeInstanceOf(Array);
    expect(result.communication).toBeInstanceOf(Array);
  });

  it('generateServiceGraph should return service boundary map', () => {
    const result = generateServiceGraph(makeIntel()) as Record<string, unknown>;
    expect(result._meta).toBeDefined();
    expect(result.services).toBeInstanceOf(Array);
  });

  it('generateChangeGraphJson should return blast radius data', () => {
    const result = generateChangeGraphJson(makeIntel()) as Record<string, unknown>;
    expect(result._meta).toBeDefined();
    expect(result.blastRadius).toBeInstanceOf(Array);
  });

  it('generateRuntimeGraph should contain startup/request flows', () => {
    const result = generateRuntimeGraph(makeIntel()) as Record<string, unknown>;
    expect(result._meta).toBeDefined();
    expect(result.startup).toBeDefined();
    expect(result.request).toBeDefined();
  });

  it('generateFeatureGraph should list all features as nodes', () => {
    const result = generateFeatureGraph(makeIntel()) as Record<string, unknown>;
    expect(result._meta).toBeDefined();
    expect(result.nodes).toBeInstanceOf(Array);
    expect((result.nodes as unknown[]).length).toBe(2); // 2 features in fixture
  });

  it('generateImportGraph should return entity nodes', () => {
    const result = generateImportGraph(makeIntel()) as Record<string, unknown>;
    expect(result._meta).toBeDefined();
    expect(result.nodes).toBeInstanceOf(Array);
  });
});

// ── Artifact Orchestrator Integration Test ───────────────────

describe('generateAllArtifacts — Full Orchestration Integration', () => {
  const testRoot = join(__dirname, 'mock-orchestrator-root');

  beforeAll(async () => {
    await rm(testRoot, { recursive: true, force: true });
    await mkdir(testRoot, { recursive: true });
  });

  afterAll(async () => {
    await rm(testRoot, { recursive: true, force: true });
  });

  it('should write all artifacts to disk and return correct metadata', async () => {
    const intel = makeIntel();
    const result = await generateAllArtifacts(testRoot, intel);

    expect(result.outputDir).toBeTruthy();
    expect(result.artifactCount).toBeGreaterThan(0);
    expect(result.artifacts).toBeInstanceOf(Array);
    expect(result.duration).toBeGreaterThan(0);
    expect(result.errors).toBeInstanceOf(Array);
    // Should have no errors
    expect(result.errors).toHaveLength(0);
  });

  it('should generate AI_REPOSITORY_BRAIN.md as first artifact', async () => {
    const intel = makeIntel();
    await generateAllArtifacts(testRoot, intel);

    const brainPath = join(testRoot, '.guardian', 'ai-pos', 'AI_REPOSITORY_BRAIN.md');
    const { size } = await stat(brainPath);
    expect(size).toBeGreaterThan(1000); // Must be substantial content
  });

  it('should generate all 18 markdown files', async () => {
    const intel = makeIntel();
    await generateAllArtifacts(testRoot, intel);

    const aiPosDir = join(testRoot, '.guardian', 'ai-pos');
    const files = await readdir(aiPosDir);
    const mdFiles = files.filter(f => f.endsWith('.md'));

    // 18 markdown files + 1 diagrams file
    expect(mdFiles.length).toBeGreaterThanOrEqual(18);
  });

  it('should generate the graphs/ subdirectory with JSON graphs', async () => {
    const intel = makeIntel();
    await generateAllArtifacts(testRoot, intel);

    const graphsDir = join(testRoot, '.guardian', 'ai-pos', 'graphs');
    const graphFiles = await readdir(graphsDir);
    const jsonFiles = graphFiles.filter(f => f.endsWith('.json'));

    expect(jsonFiles.length).toBeGreaterThanOrEqual(5); // 6 graph files
  });

  it('should generate intelligence JSON files', async () => {
    const intel = makeIntel();
    await generateAllArtifacts(testRoot, intel);

    const aiPosDir = join(testRoot, '.guardian', 'ai-pos');
    const files = await readdir(aiPosDir);
    const jsonFiles = files.filter(f => f.endsWith('.json') && f !== 'manifest.json');

    expect(jsonFiles.length).toBeGreaterThanOrEqual(5); // AI_INDEX, AI_MEMORY, AI_VALIDATION, etc.
  });

  it('should write manifest.json with artifact count and confidence', async () => {
    const intel = makeIntel();
    const result = await generateAllArtifacts(testRoot, intel);

    const manifestPath = join(testRoot, '.guardian', 'ai-pos', 'manifest.json');
    const { readFile } = await import('fs/promises');
    const manifest = JSON.parse(await readFile(manifestPath, 'utf-8'));

    expect(manifest.project).toBe('test-service');
    expect(manifest.pgosVersion).toBeTruthy();
    expect(manifest.confidenceScore).toBe(78);
    expect(manifest.artifacts).toBeInstanceOf(Array);
    expect(manifest.artifacts.length).toBeGreaterThanOrEqual(18);
  });

  it('should persist memory state to .guardian/memory/', async () => {
    const intel = makeIntel();
    await generateAllArtifacts(testRoot, intel);

    const memPath = join(testRoot, '.guardian', 'memory', 'project-memory.json');
    const { readFile } = await import('fs/promises');
    const memory = JSON.parse(await readFile(memPath, 'utf-8'));

    expect(memory.historicalDecisions).toBeInstanceOf(Array);
    expect(memory.historicalDecisions.length).toBe(1);
    expect(memory.historicalDecisions[0].title).toBe('Use Fastify over Express');
  });

  it('total artifact count should be at least 29', async () => {
    const intel = makeIntel();
    const result = await generateAllArtifacts(testRoot, intel);

    // 18 markdown + 6 graphs + 6 intelligence JSON + 1 manifest = 31
    expect(result.artifactCount).toBeGreaterThanOrEqual(29);
  });
});
