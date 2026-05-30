// ============================================================
// @pgos/semantic-git — Entry Point
// AI-native version control with semantic awareness
// ============================================================

import { join } from 'path';
import {
  type SemanticCommit,
  type SemanticChange,
  type SemanticDiff,
  type SemanticChangeType,
  type ImpactArea,
  type ImpactSummary,
  type RiskAssessment,
  generateId,
  componentLogger,
  isGitRepo,
  getLog,
  getChangedFiles,
  getCurrentSha,
  createCommit,
} from '@pgos/core';

const log = componentLogger('semantic-git');

/**
 * Create a semantic commit with impact analysis
 */
export async function semanticCommit(
  rootPath: string,
  message: string,
  options: { projectId: string; sessionId?: string; files?: string[] } = { projectId: '' }
): Promise<SemanticCommit> {
  log.info({ rootPath, message }, 'Creating semantic commit');

  if (!(await isGitRepo(rootPath))) {
    throw new Error('Not a git repository');
  }

  // Get changed files before committing
  const changes = await getChangedFiles(rootPath);

  // Analyze semantic impact
  const semanticChanges = analyzeChanges(changes);
  const semanticType = inferCommitType(message, semanticChanges);
  const impactAreas = analyzeImpact(semanticChanges);
  const riskScore = calculateRisk(semanticChanges, impactAreas);

  // Create the actual git commit
  const gitSha = await createCommit(rootPath, message, options.files);

  const commit: SemanticCommit = {
    id: generateId(),
    projectId: options.projectId,
    sessionId: options.sessionId,
    gitSha,
    semanticType,
    impactAreas,
    changes: semanticChanges,
    riskScore,
    validated: false,
    createdAt: new Date(),
  };

  log.info({
    commitId: commit.id,
    type: semanticType,
    risk: riskScore,
    files: changes.length,
  }, 'Semantic commit created');

  return commit;
}

/**
 * Generate a semantic diff between two points
 */
export async function semanticDiff(
  rootPath: string,
  fromCommit?: string,
  toCommit?: string
): Promise<SemanticDiff> {
  const changes = await getChangedFiles(rootPath, fromCommit, toCommit);
  const semanticChanges = analyzeChanges(changes);

  const impactSummary: ImpactSummary = {
    totalFiles: changes.length,
    securityImpact: semanticChanges.some((c) => c.categories.includes('security_changed')),
    architectureImpact: semanticChanges.some((c) => c.categories.includes('architecture_drift')),
    testImpact: semanticChanges.some((c) => c.categories.includes('tests_removed') || c.categories.includes('tests_added')),
    performanceImpact: semanticChanges.some((c) => c.categories.includes('performance_impacted')),
    breakingChanges: semanticChanges.some((c) => c.categories.includes('api_changed')),
    riskLevel: 'low',
  };

  const riskAssessment: RiskAssessment = {
    overall: calculateRisk(semanticChanges, analyzeImpact(semanticChanges)),
    factors: [],
    recommendation: 'proceed',
  };

  if (riskAssessment.overall > 70) {
    impactSummary.riskLevel = 'critical';
    riskAssessment.recommendation = 'block';
  } else if (riskAssessment.overall > 40) {
    impactSummary.riskLevel = 'high';
    riskAssessment.recommendation = 'review';
  } else if (riskAssessment.overall > 20) {
    impactSummary.riskLevel = 'medium';
  }

  return {
    fromCommit: fromCommit || 'HEAD',
    toCommit: toCommit || 'working',
    semanticChanges,
    impactSummary,
    riskAssessment,
  };
}

function analyzeChanges(changes: { file: string; status: string; linesAdded: number; linesRemoved: number }[]): SemanticChange[] {
  return changes.map((change) => ({
    file: change.file,
    type: change.status as SemanticChange['type'],
    semanticImpact: `${change.linesAdded} added, ${change.linesRemoved} removed`,
    categories: categorizeChange(change.file, change.linesAdded, change.linesRemoved),
    linesAdded: change.linesAdded,
    linesRemoved: change.linesRemoved,
  }));
}

function categorizeChange(file: string, added: number, removed: number): SemanticChange['categories'] {
  const categories: SemanticChange['categories'] = [];
  const lower = file.toLowerCase();

  if (lower.includes('test') || lower.includes('spec')) {
    categories.push(removed > added ? 'tests_removed' : 'tests_added');
  }
  if (lower.includes('security') || lower.includes('auth') || lower.includes('crypto')) {
    categories.push('security_changed');
  }
  if (lower.includes('config') || lower.includes('.env')) {
    categories.push('config_changed');
  }
  if (lower.includes('package.json') || lower.includes('requirements') || lower.includes('go.mod')) {
    categories.push('dependency_updated');
  }
  if (lower.includes('schema') || lower.includes('migration')) {
    categories.push('schema_changed');
  }
  if (lower.includes('api') || lower.includes('route')) {
    categories.push('api_changed');
  }

  return categories;
}

function inferCommitType(message: string, changes: SemanticChange[]): SemanticChangeType {
  const lower = message.toLowerCase();
  if (lower.includes('fix') || lower.includes('bug')) return 'fix';
  if (lower.includes('feat') || lower.includes('add')) return 'feature';
  if (lower.includes('refactor')) return 'refactor';
  if (lower.includes('test')) return 'test';
  if (lower.includes('doc')) return 'docs';
  if (lower.includes('security') || lower.includes('auth')) return 'security';
  if (lower.includes('perf') || lower.includes('optim')) return 'performance';
  if (lower.includes('config') || lower.includes('ci')) return 'config';
  if (lower.includes('dep') || lower.includes('upgrade')) return 'dependency';
  return 'feature';
}

function analyzeImpact(changes: SemanticChange[]): ImpactArea[] {
  const areas = new Map<string, ImpactArea>();

  for (const change of changes) {
    const layer = change.file.split('/')[0] || 'root';
    if (!areas.has(layer)) {
      areas.set(layer, {
        layer,
        component: layer,
        severity: 'low',
        description: `${changes.filter((c) => c.file.startsWith(layer)).length} files changed`,
      });
    }
  }

  return Array.from(areas.values());
}

function calculateRisk(changes: SemanticChange[], impacts: ImpactArea[]): number {
  let risk = 0;

  for (const change of changes) {
    if (change.categories.includes('security_changed')) risk += 20;
    if (change.categories.includes('architecture_drift')) risk += 15;
    if (change.categories.includes('tests_removed')) risk += 25;
    if (change.categories.includes('schema_changed')) risk += 10;
    if (change.linesRemoved > change.linesAdded * 2) risk += 10;
  }

  return Math.min(100, risk);
}

export { type SemanticCommit, type SemanticDiff };
