// ============================================================
// @pgos/token-optimizer — Entry Point
// Token usage analysis, context compression, and budget management
// ============================================================

import { estimateTokens, truncateToTokenBudget, tokenReduction, componentLogger } from '@pgos/core';
import type { ProjectIntelligence, ContextLevel, AINavigationMap } from '@pgos/core';

const log = componentLogger('token-optimizer');

export interface TokenBudget {
  total: number;
  allocated: Map<string, number>;
  used: Map<string, number>;
  remaining: number;
}

export interface CompressionResult {
  original: string;
  compressed: string;
  originalTokens: number;
  compressedTokens: number;
  reductionPercent: number;
  strategy: string;
}

/**
 * Analyze token usage for content
 */
export function analyzeTokenUsage(contents: Record<string, string>): {
  breakdown: { name: string; tokens: number; percentage: number }[];
  total: number;
} {
  const breakdown: { name: string; tokens: number; percentage: number }[] = [];
  let total = 0;
  for (const [name, content] of Object.entries(contents)) {
    const tokens = estimateTokens(content);
    total += tokens;
    breakdown.push({ name, tokens, percentage: 0 });
  }
  for (const item of breakdown) {
    item.percentage = total > 0 ? Math.round((item.tokens / total) * 100) : 0;
  }
  breakdown.sort((a, b) => b.tokens - a.tokens);
  return { breakdown, total };
}

/**
 * Compress content using various strategies
 */
export function compressContext(
  content: string,
  maxTokens: number,
  strategy: 'whitespace' | 'summary' | 'selective' | 'aggressive' = 'whitespace'
): CompressionResult {
  const originalTokens = estimateTokens(content);
  if (originalTokens <= maxTokens) {
    return {
      original: content,
      compressed: content,
      originalTokens,
      compressedTokens: originalTokens,
      reductionPercent: 0,
      strategy,
    };
  }
  let compressed: string;
  switch (strategy) {
    case 'whitespace':
      compressed = compressWhitespace(content);
      break;
    case 'summary':
      compressed = compressBySummary(content, maxTokens);
      break;
    case 'selective':
      compressed = compressSelective(content, maxTokens);
      break;
    case 'aggressive':
      compressed = compressAggressive(content, maxTokens);
      break;
    default:
      compressed = content;
  }
  compressed = truncateToTokenBudget(compressed, maxTokens);
  const compressedTokens = estimateTokens(compressed);
  log.info({
    originalTokens,
    compressedTokens,
    reduction: `${tokenReduction(originalTokens, compressedTokens)}%`,
    strategy,
  }, 'Context compressed');
  return {
    original: content,
    compressed,
    originalTokens,
    compressedTokens,
    reductionPercent: tokenReduction(originalTokens, compressedTokens),
    strategy,
  };
}

/**
 * Create a token budget allocation
 */
export function createBudget(totalTokens: number, allocations: Record<string, number>): TokenBudget {
  const allocated = new Map<string, number>();
  const used = new Map<string, number>();
  let totalAllocated = 0;
  for (const [key, percentage] of Object.entries(allocations)) {
    const tokens = Math.floor(totalTokens * (percentage / 100));
    allocated.set(key, tokens);
    used.set(key, 0);
    totalAllocated += tokens;
  }
  return {
    total: totalTokens,
    allocated,
    used,
    remaining: totalTokens - totalAllocated,
  };
}

/**
 * Check if a section fits in its budget
 */
export function checkBudget(budget: TokenBudget, section: string, content: string): {
  fits: boolean;
  tokensNeeded: number;
  tokensAvailable: number;
} {
  const tokensNeeded = estimateTokens(content);
  const tokensAvailable = (budget.allocated.get(section) || 0) - (budget.used.get(section) || 0);
  return {
    fits: tokensNeeded <= tokensAvailable,
    tokensNeeded,
    tokensAvailable,
  };
}

/**
 * Generate a multi-level semantic summary optimized for token budgets
 */
export function generateMultiLevelSummary(intel: ProjectIntelligence, level: ContextLevel): string {
  const p = intel.projectIdentity;
  const a = intel.architecture;
  const fm = intel.featureMatrix;
  const r = intel.riskIntelligence;
  const s = intel.safetyClassification;
  const flows = intel.executionFlows;
  const d = intel.domainModel;

  const L0 = `[L0 SNAPSHOT] Repo: ${p.name} | Lang: ${p.primaryLanguage} (${p.repoType}) | Loc: ${p.totalLoc} | Files: ${p.totalFiles} | Status: ${p.status} | Maturity: ${p.maturity}`;

  if (level === 'L0') return L0;

  const L1 = `${L0}
[L1 ARCHITECTURE] Pattern: ${a.detectedPattern} (${a.confidence}% confidence)
  Layers: ${a.layers.map(l => `${l.name} (${l.components.slice(0, 3).join(', ')})`).join(' -> ')}
  Boundary interfaces: ${a.boundaries.slice(0, 3).map(b => `${b.name} [${b.type}]`).join(', ') || 'N/A'}`;

  if (level === 'L1') return L1;

  const L2 = `${L1}
[L2 FEATURES] Total: ${fm.totalFeatures} | Implemented: ${fm.implementedCount} | Tested: ${fm.testedCount}
  Features: ${fm.features.slice(0, 8).map(f => `${f.name} (${f.status})`).join(', ')}`;

  if (level === 'L2') return L2;

  const L3 = `${L2}
[L3 RUNTIME LIFECYCLE]
  Startup: ${flows.startup.steps.slice(0, 4).map(s => `${s.order}: ${s.action}`).join(' -> ') || 'N/A'}
  Request Flow: ${flows.request.steps.slice(0, 4).map(s => `${s.order}: ${s.action}`).join(' -> ') || 'N/A'}
  Recovery: ${flows.recovery.steps.slice(0, 2).map(s => s.action).join(', ') || 'N/A'}
  Shutdown: ${flows.shutdown.steps.slice(0, 2).map(s => s.action).join(', ') || 'N/A'}`;

  if (level === 'L3') return L3;

  const L4 = `${L3}
[L4 MODULES & DEPS]
  Config Files: ${intel.configIntelligence.configFiles.slice(0, 5).map(c => c.path).join(', ')}
  Env Vars: ${intel.configIntelligence.envVars.slice(0, 8).map(v => v.name).join(', ')}
  ORM: ${intel.dataIntelligence.ormUsed || 'None'}
  Technical Debt Count: ${intel.technicalDebt.totalCount} (Critical: ${intel.technicalDebt.criticalCount})`;

  if (level === 'L4') return L4;

  const L5 = `${L4}
[L5 FILE CLASSIFICATION & RISKS] Risk Score: ${r.overallRiskScore}/100
  Safety Zones: Safe: ${s.safeFiles.length} | Caution: ${s.cautionFiles.length} | Critical: ${s.criticalFiles.length} | DNM: ${s.doNotModifyZones.length}
  Critical files: ${r.criticalFiles.slice(0, 5).map(f => f.split(/[\\/]/).pop()).join(', ')}
  High Blast Radius: ${r.blastRadiusMap.slice(0, 4).map(b => `${b.file.split(/[\\/]/).pop()} (${b.dependentCount} deps)`).join(', ')}`;

  if (level === 'L5') return L5;

  // L6: Semantic chunk granular
  const L6 = `${L5}
[L6 DOMAIN ENTITIES & SCHEMAS]
  Entities: ${d.entities.slice(0, 15).map(e => `${e.name} [${e.type}]`).join(', ')}
  Glossary: ${d.glossary.slice(0, 8).map(g => `${g.term}: ${g.definition.slice(0, 40)}...`).join(', ')}
  API Endpoints: ${intel.apiIntelligence.endpoints.slice(0, 8).map(e => `${e.method} ${e.path}`).join(', ')}`;

  return L6;
}

/**
 * Generate AI Navigation Map mapping user need to appropriate files
 */
export function generateNavigationMap(intel: Partial<ProjectIntelligence>): AINavigationMap {
  return {
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
}

// ── Compression Strategies ──

function compressWhitespace(content: string): string {
  return content
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, '')  // Remove block comments
    .replace(/\/\/.*$/gm, '')          // Remove line comments
    .trim();
}

function compressBySummary(content: string, maxTokens: number): string {
  const lines = content.split('\n');
  const importantLines = lines.filter((line) => {
    const trimmed = line.trim();
    return (
      trimmed.startsWith('export') ||
      trimmed.startsWith('import') ||
      trimmed.startsWith('class ') ||
      trimmed.startsWith('interface ') ||
      trimmed.startsWith('type ') ||
      trimmed.startsWith('function ') ||
      trimmed.startsWith('const ') ||
      trimmed.startsWith('##') ||
      trimmed.startsWith('- ') ||
      trimmed.length === 0
    );
  });
  return importantLines.join('\n');
}

function compressSelective(content: string, maxTokens: number): string {
  let result = content;
  result = result.replace(/\/\*\*[\s\S]*?\*\//g, ''); // JSDoc
  result = result.replace(/\/\/.*$/gm, '');             // Comments
  result = result.replace(/console\.(log|debug|info)\(.*\);?/g, ''); // Console logs
  result = compressWhitespace(result);
  return result;
}

function compressAggressive(content: string, maxTokens: number): string {
  let result = compressSelective(content, maxTokens);
  result = result.replace(/\{[^{}]*\}/g, '{ /* ... */ }');
  return result;
}
