// ============================================================
// @pgos/validation-engine — Completion Checker
// Detect false completion claims and incomplete implementations
// ============================================================

import { readFile } from 'fs/promises';
import { join } from 'path';
import {
  type CompletionScore,
  type RequirementScore,
  type RequirementStatus,
  type AntiPattern,
  type AntiPatternType,
  listFilesRecursive,
  isBinaryFile,
  componentLogger,
  ANTI_PATTERNS,
  fileExists,
} from '@pgos/core';

const log = componentLogger('completion-checker');

export interface FeatureVerificationReport {
  featureName: string;
  feature_exists: boolean;
  implemented: boolean;
  tested: boolean;
  documented: boolean;
  confidence: number; // 0-100
  evidence: string[];
}

/**
 * Check project completion against requirements
 */
export async function checkCompletion(
  rootPath: string,
  requirements: string[]
): Promise<CompletionScore & { featureVerifications?: FeatureVerificationReport[] }> {
  log.info({ rootPath, requirements: requirements.length }, 'Checking completion');

  // Scan all source files
  const files = await listFilesRecursive(rootPath);
  const sourceFiles = files.filter((f) => !isBinaryFile(f));

  // Detect anti-patterns across all files
  const antiPatterns = await detectAntiPatterns(sourceFiles);

  // Score each requirement
  const requirementScores = await scoreRequirements(requirements, sourceFiles, rootPath);

  // Run feature claim verifications to prevent false claims
  const featureVerifications = await Promise.all(
    requirements.map((req) => verifyFeatureClaim(req, sourceFiles, rootPath, antiPatterns))
  );

  // Calculate overall score
  const completed = requirementScores.filter((r) => r.status === 'complete').length;
  const partial = requirementScores.filter((r) => r.status === 'partial').length;
  const absent = requirementScores.filter((r) => r.status === 'absent' || r.status === 'stub').length;

  const overall = requirements.length > 0
    ? Math.round(((completed + partial * 0.5) / requirements.length) * 100)
    : 100;

  log.info({
    overall,
    completed,
    partial,
    absent,
    antiPatterns: antiPatterns.length,
  }, 'Completion check done');

  return {
    overall,
    requirements: requirementScores,
    antiPatterns,
    totalRequirements: requirements.length,
    completedRequirements: completed,
    partialRequirements: partial,
    absentRequirements: absent,
    featureVerifications,
  };
}

/**
 * Detect anti-patterns in source files
 */
export async function detectAntiPatterns(filePaths: string[]): Promise<AntiPattern[]> {
  const patterns: AntiPattern[] = [];

  for (const filePath of filePaths) {
    try {
      const content = await readFile(filePath, 'utf-8');
      const lines = content.split('\n');

      for (const [patternName, regex] of Object.entries(ANTI_PATTERNS)) {
        const re = new RegExp(regex.source, regex.flags);
        let match: RegExpExecArray | null;

        while ((match = re.exec(content)) !== null) {
          const lineNum = content.slice(0, match.index).split('\n').length;
          const lineContent = lines[lineNum - 1]?.trim() || '';

          patterns.push({
            type: patternName as AntiPatternType,
            file: filePath,
            line: lineNum,
            content: lineContent,
            severity: getSeverity(patternName as AntiPatternType),
            suggestion: getSuggestion(patternName as AntiPatternType),
          });
        }
      }
    } catch {
      // Skip unreadable files
    }
  }

  return patterns;
}

/**
 * Perform fine-grained feature claim verification (false-generation prevention)
 */
export async function verifyFeatureClaim(
  feature: string,
  sourceFiles: string[],
  rootPath: string,
  knownAntiPatterns: AntiPattern[]
): Promise<FeatureVerificationReport> {
  const keywords = extractKeywords(feature);
  const matchingFiles: string[] = [];
  const evidence: string[] = [];
  
  let hasProductionCode = false;
  let hasTestCode = false;
  let hasDocs = false;

  const keywordsLower = keywords.map(k => k.toLowerCase());

  // Search files for evidence
  for (const filePath of sourceFiles.slice(0, 300)) {
    const filename = filePath.toLowerCase();
    
    // Check if filename contains keywords
    const matchesFilename = keywordsLower.some(k => filename.includes(k));
    
    if (matchesFilename) {
      matchingFiles.push(filePath);
      
      const isTest = filename.includes('test') || filename.includes('spec') || filename.includes('__tests__');
      const isDoc = filename.includes('readme') || filename.includes('.md') || filename.includes('docs/');
      
      if (isTest) {
        hasTestCode = true;
        evidence.push(`Test file: ${filePath.replace(rootPath, '')}`);
      } else if (isDoc) {
        hasDocs = true;
        evidence.push(`Doc file: ${filePath.replace(rootPath, '')}`);
      } else {
        hasProductionCode = true;
        evidence.push(`Source implementation: ${filePath.replace(rootPath, '')}`);
      }
    }
  }

  // Filter anti-patterns matching our matching files
  const fileAntiPatterns = knownAntiPatterns.filter(ap => matchingFiles.includes(ap.file));
  const hasStubs = fileAntiPatterns.some(ap => ['stub', 'placeholder', 'not_implemented', 'throw_not_implemented'].includes(ap.type));
  const hasMocks = fileAntiPatterns.some(ap => ap.type === 'mock_logic');

  const feature_exists = matchingFiles.length > 0;
  const implemented = feature_exists && hasProductionCode && !hasStubs;
  const tested = hasTestCode;
  const documented = hasDocs;

  // Calculate confidence score
  let confidence = 0;
  if (feature_exists) confidence += 20;
  if (hasProductionCode) confidence += 30;
  if (implemented) confidence += 20;
  if (tested) confidence += 20;
  if (documented) confidence += 10;
  
  // Deductions
  if (hasStubs) confidence = Math.max(0, confidence - 40);
  if (hasMocks) confidence = Math.max(0, confidence - 20);

  return {
    featureName: feature,
    feature_exists,
    implemented,
    tested,
    documented,
    confidence,
    evidence: evidence.slice(0, 5),
  };
}

/**
 * Score requirements against implementation
 */
async function scoreRequirements(
  requirements: string[],
  sourceFiles: string[],
  rootPath: string
): Promise<RequirementScore[]> {
  const scores: RequirementScore[] = [];

  // Build a search index of all file contents
  const fileContents = new Map<string, string>();
  for (const file of sourceFiles.slice(0, 500)) {
    try {
      const content = await readFile(file, 'utf-8');
      fileContents.set(file, content.toLowerCase());
    } catch {
      // Skip
    }
  }

  for (const req of requirements) {
    const keywords = extractKeywords(req);
    const matchingFiles: string[] = [];
    let totalMatches = 0;

    for (const [file, content] of fileContents) {
      let fileMatches = 0;
      for (const keyword of keywords) {
        if (content.includes(keyword.toLowerCase())) {
          fileMatches++;
        }
      }
      if (fileMatches > 0) {
        matchingFiles.push(file);
        totalMatches += fileMatches;
      }
    }

    const coverage = keywords.length > 0 ? totalMatches / (keywords.length * Math.max(matchingFiles.length, 1)) : 0;
    const hasStubs = matchingFiles.some((f) => {
      const content = fileContents.get(f) || '';
      return /todo|fixme|not.?implemented|stub|placeholder/i.test(content);
    });

    let status: RequirementStatus;
    let score: number;

    if (matchingFiles.length === 0) {
      status = 'absent';
      score = 0;
    } else if (hasStubs) {
      status = 'stub';
      score = 20;
    } else if (coverage < 0.3) {
      status = 'partial';
      score = 40;
    } else if (coverage < 0.7) {
      status = 'partial';
      score = 60;
    } else {
      status = 'complete';
      score = Math.min(100, Math.round(coverage * 100));
    }

    const blockers: string[] = [];
    if (hasStubs) blockers.push('Contains stubs or TODOs');
    if (matchingFiles.length === 0) blockers.push('No implementation found');

    scores.push({
      name: req,
      score,
      status,
      evidence: matchingFiles.slice(0, 5),
      blockers,
    });
  }

  return scores;
}

/**
 * Extract search keywords from a requirement string
 */
function extractKeywords(requirement: string): string[] {
  const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may',
    'might', 'can', 'shall', 'must', 'need', 'to', 'of', 'in', 'for', 'on', 'with', 'at',
    'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below',
    'between', 'out', 'off', 'over', 'under', 'again', 'further', 'then', 'once',
    'and', 'but', 'or', 'nor', 'not', 'so', 'yet', 'both', 'either', 'neither',
    'each', 'every', 'all', 'any', 'few', 'more', 'most', 'other', 'some', 'such',
    'user', 'system', 'should', 'implement', 'create', 'add', 'support']);

  return requirement
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word));
}

/**
 * Get severity for an anti-pattern type
 */
function getSeverity(type: AntiPatternType): AntiPattern['severity'] {
  switch (type) {
    case 'not_implemented':
    case 'throw_not_implemented':
    case 'placeholder':
    case 'hardcoded':
      return 'critical';
    case 'todo':
    case 'fixme':
    case 'mock_logic':
    case 'stub':
    case 'empty_function':
      return 'error';
    case 'hack':
    case 'commented_code':
    case 'pass_statement':
      return 'warning';
    default:
      return 'warning';
  }
}

/**
 * Get suggestion for an anti-pattern type
 */
function getSuggestion(type: AntiPatternType): string {
  switch (type) {
    case 'todo':
      return 'Complete the TODO item or create a ticket';
    case 'fixme':
      return 'Fix the known issue or document why it cannot be fixed';
    case 'hack':
      return 'Refactor to remove the hack with a proper solution';
    case 'not_implemented':
    case 'throw_not_implemented':
      return 'Implement the missing functionality';
    case 'mock_logic':
      return 'Replace mock logic with real implementation';
    case 'placeholder':
      return 'Replace placeholder content with real data';
    case 'hardcoded':
      return 'Move hardcoded values to configuration or environment variables';
    case 'stub':
      return 'Complete the stub implementation';
    case 'empty_function':
      return 'Add implementation to the empty function';
    case 'commented_code':
      return 'Remove commented-out code or document why it exists';
    case 'pass_statement':
      return 'Add implementation (Python pass statement detected)';
    default:
      return 'Review and resolve this pattern';
  }
}
