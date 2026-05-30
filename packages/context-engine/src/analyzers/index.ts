// ============================================================
// @pgos/context-engine — Analyzers Orchestration
// Combines results from all AST analyzers into the unified ProjectIntelligence.
// ============================================================

import { basename, resolve, join } from 'path';
import { readFileSync, existsSync } from 'fs';
import { ParsedFile } from '../parser/ast-parser.js';
import type { DependencyGraph } from '../parser/dependency-parser.js';
import type { ProjectIntelligence, ProjectIdentity } from '@pgos/core';

import { detectArchitecture } from './architecture-detector.js';
import { extractAPIIntelligence } from './api-extractor.js';
import { classifyFileSafety } from './safety-classifier.js';
import { analyzeRisks } from './risk-analyzer.js';
import { extractDomainModel } from './domain-extractor.js';
import { detectFeatures } from './feature-detector.js';
import { extractConfigIntelligence } from './config-extractor.js';
import { analyzeSecurityModel } from './security-analyzer.js';
import { analyzePerformance } from './performance-analyzer.js';
import { extractObservability } from './observability-extractor.js';
import { analyzeRuntime } from './runtime-analyzer.js';
import { collectTestIntelligence } from './test-intelligence.js';
import { evaluateReadiness } from './readiness-engine.js';
import { extractDataIntelligence } from './data-intelligence.js';
import { extractEventIntelligence } from './event-intelligence.js';

export { detectArchitecture } from './architecture-detector.js';
export { extractAPIIntelligence } from './api-extractor.js';
export { classifyFileSafety } from './safety-classifier.js';
export { analyzeRisks } from './risk-analyzer.js';
export { extractDomainModel } from './domain-extractor.js';
export { detectFeatures } from './feature-detector.js';
export { extractConfigIntelligence } from './config-extractor.js';
export { analyzeSecurityModel } from './security-analyzer.js';
export { analyzePerformance } from './performance-analyzer.js';
export { extractObservability } from './observability-extractor.js';
export { analyzeRuntime } from './runtime-analyzer.js';
export { collectTestIntelligence } from './test-intelligence.js';
export { evaluateReadiness } from './readiness-engine.js';
export { extractDataIntelligence } from './data-intelligence.js';
export { extractEventIntelligence } from './event-intelligence.js';

/**
 * Executes all intelligence analyzers on parsed file structures.
 */
export async function runAllAnalyzers(
  mockRoot: string,
  files: ParsedFile[],
  depGraph: DependencyGraph,
  modules: any[] = []
): Promise<ProjectIntelligence> {
  const resolvedRoot = resolve(mockRoot);
  let projectName = basename(resolvedRoot) || 'service';
  let packageManager = files.some(f => f.path.includes('pnpm-lock')) ? 'pnpm' : 'npm';
  let projectSummary = files.find(f => f.path.toLowerCase().includes('readme'))?.semanticDesc || 'AI-POS managed microservice repository.';

  try {
    const pkgJsonPath = join(resolvedRoot, 'package.json');
    if (existsSync(pkgJsonPath)) {
      const pkg = JSON.parse(readFileSync(pkgJsonPath, 'utf8'));
      if (pkg.name) projectName = pkg.name;
      if (pkg.description) projectSummary = pkg.description;
      if (pkg.packageManager) {
        if (pkg.packageManager.includes('pnpm')) packageManager = 'pnpm';
        else if (pkg.packageManager.includes('yarn')) packageManager = 'yarn';
        else if (pkg.packageManager.includes('bun')) packageManager = 'bun';
        else packageManager = 'npm';
      }
    }
  } catch (err) {
    // Non-critical fallback
  }

  // ── Project Identity ─────────────────────────────────────
  const totalFiles = files.length;
  const totalLoc = files.reduce((s, f) => s + f.loc, 0);

  // Group languages LOC
  const languages: Record<string, number> = {};
  for (const f of files) {
    languages[f.language] = (languages[f.language] || 0) + f.loc;
  }
  const primaryLanguage = Object.entries(languages)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'TypeScript';

  const allImports = files.flatMap(f => f.rawImports);
  let framework = 'Plain App';
  if (allImports.some(i => i.includes('fastify'))) framework = 'Fastify';
  else if (allImports.some(i => i.includes('express'))) framework = 'Express';
  else if (allImports.some(i => i.includes('@nestjs'))) framework = 'NestJS';
  else if (allImports.some(i => i.includes('next'))) framework = 'Next.js';

  const projectIdentity: ProjectIdentity = {
    name: projectName,
    summary: projectSummary,
    goals: ['Production performance stability', 'Modular service capability interfaces'],
    nonGoals: ['Replacing business domains rules engines'],
    maturity: 'beta',
    status: 'active',
    priorities: ['Maintainability', 'Validation checks verification'],
    primaryLanguage: primaryLanguage.toLowerCase(),
    languages,
    framework,
    buildSystem: files.some(f => f.path.includes('turbo')) ? 'Turborepo' : 'NPM Workspace',
    repoType: files.some(f => f.path.includes('pnpm-workspace')) ? 'monorepo' : 'single',
    packageManager,
    totalFiles,
    totalLoc,
  };

  // ── Component Analyzers Orchestration ────────────────────
  const domainModel = extractDomainModel(resolvedRoot, files);
  const architecture = detectArchitecture(resolvedRoot, files, modules);
  const executionFlows = analyzeRuntime(resolvedRoot, files);
  const featureMatrix = detectFeatures(resolvedRoot, files);
  const apiIntelligence = extractAPIIntelligence(resolvedRoot, files);
  const dataIntelligence = {
    tables: [],
    indexes: [],
    migrations: [],
    ormUsed: files.some(f => f.rawImports.some(i => /drizzle/i.test(i))) ? 'Drizzle' : undefined,
  };
  const configIntelligence = await extractConfigIntelligence(resolvedRoot, files);
  const securityIntelligence = await analyzeSecurityModel(resolvedRoot, files);
  const performanceIntelligence = await analyzePerformance(resolvedRoot, files);
  const observabilityIntelligence = extractObservability(resolvedRoot, files);
  
  // Technical Debt
  const todosList = files.flatMap(f => f.todos);
  const technicalDebt = {
    items: todosList.map(t => ({
      type: t.type.toLowerCase() as any,
      file: t.file,
      line: t.line,
      description: `// ${t.type}: ${t.text}`,
      severity: t.type === 'FIXME' || t.type === 'BUG' ? ('high' as const) : ('medium' as const),
    })),
    totalCount: todosList.length,
    criticalCount: todosList.filter(t => t.type === 'FIXME' || t.type === 'BUG').length,
    estimatedEffort: todosList.length > 5 ? 'Weeks' : 'Days',
  };

  const safetyClassification = classifyFileSafety(resolvedRoot, files, []);
  
  // Dynamic AI Rules
  const aiEditRules = {
    always: [
      'Write clean, typed, modular TypeScript code conforming to the target interface.',
      'Check relative import resolutions before saving edits.',
      'Validate overall code compiles by running pnpm build.',
    ],
    never: [
      'Avoid hardcoding passwords, API tokens, database keys or secrets.',
      'Do not delete pnpm lockfiles or change standard configurations paths.',
    ],
    beforeEdit: [
      'Verify target safety classification zones of files before editing.',
      'Compute transited dependency blast radius scores.',
    ],
    afterEdit: [
      'Execute the standard verification tests suites.',
      'Confirm the new changes compile clean.',
    ],
  };

  const riskIntelligence = analyzeRisks(resolvedRoot, files, depGraph);
  
  // Validation (Dummy baseline; will be updated by the Continuous Validator)
  const validationIntelligence = {
    confidenceScore: 90,
    staleStatus: [],
    verificationReport: [],
    timestamp: new Date().toISOString(),
    generationDuration: 0,
    artifactCount: 0,
    warnings: [],
  };

  // Project Memory
  const memoryState = {
    historicalDecisions: [],
    rejectedIdeas: [],
    activeWork: [],
    plannedWork: [],
    lastEdits: [],
    knownFailures: [],
    lessonsLearned: [],
    roadmap: [],
    evolutionHistory: [],
  };

  // Navigation map
  const navigationMap = {
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
  };

  return {
    projectIdentity,
    domainModel,
    architecture,
    executionFlows,
    featureMatrix,
    apiIntelligence,
    dataIntelligence,
    configIntelligence,
    securityIntelligence,
    performanceIntelligence,
    observabilityIntelligence,
    technicalDebt,
    safetyClassification,
    aiEditRules,
    riskIntelligence,
    validationIntelligence,
    memoryState,
    navigationMap,
    generatedAt: new Date().toISOString(),
    pgosVersion: '3.0.0',
  };
}
