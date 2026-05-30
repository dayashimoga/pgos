// ============================================================
// @pgos/context-engine — Continuous Validator
// Validates structural imports, feature completeness, test mappings,
// and staleness of compiled artifacts.
// ============================================================

import { promises as fs } from 'fs';
import { join } from 'path';
import { ParsedFile } from '../parser/ast-parser.js';
import { resolveImportPath } from '../parser/dependency-parser.js';
import type { ValidationIntelligence, VerificationEntry, StaleStatusEntry } from '@pgos/core';

/**
 * Validates the project structure, features state, and files imports.
 */
export async function validateCodebase(
  mockRoot: string,
  files: ParsedFile[],
  intel: any = {}
): Promise<ValidationIntelligence> {
  const startTime = Date.now();
  const warnings: string[] = [];
  const verificationReport: VerificationEntry[] = [];
  const filePaths = files.map(f => f.path);

  // ── 1. Import Consistency Check ─────────────────────────
  let brokenImportsCount = 0;
  for (const f of files) {
    for (const imp of f.imports) {
      if (imp.isExternal) continue;
      const resolved = resolveImportPath(f.path, imp.source, filePaths);
      if (!resolved) {
        brokenImportsCount++;
        warnings.push(`Broken import in ${f.path}: cannot resolve "${imp.source}"`);
      }
    }
  }

  verificationReport.push({
    check: 'Import Consistency',
    passed: brokenImportsCount === 0,
    message: brokenImportsCount === 0 
      ? 'All internal relative imports resolved perfectly.' 
      : `Found ${brokenImportsCount} broken internal relative import(s).`,
    severity: brokenImportsCount === 0 ? 'info' : 'error',
  });

  // ── 2. Feature Alignment Check ───────────────────────────
  const features = intel?.featureMatrix?.features || [];
  const unimplementedFeatures = features.filter((f: any) => f.status !== 'implemented');
  
  verificationReport.push({
    check: 'Feature Alignment',
    passed: unimplementedFeatures.length === 0,
    message: unimplementedFeatures.length === 0
      ? 'All specified project features are fully implemented.'
      : `Found ${unimplementedFeatures.length} unimplemented or partial feature(s).`,
    severity: unimplementedFeatures.length === 0 ? 'info' : 'warning',
  });

  // ── 3. Feature Test Coverage Check ───────────────────────
  const untestedFeatures = features.filter((f: any) => !f.tests || f.tests.length === 0);
  
  verificationReport.push({
    check: 'Feature Test Coverage',
    passed: untestedFeatures.length === 0,
    message: untestedFeatures.length === 0
      ? 'All implemented features have valid test coverage.'
      : `Found ${untestedFeatures.length} feature(s) lacking verification tests.`,
    severity: untestedFeatures.length === 0 ? 'info' : 'warning',
  });

  // ── 4. Contract Implementation Integrity ─────────────────
  const classImplementGaps = files.some(f => f.classes.some(c => c.implements && !f.interfaces.includes(c.implements)));
  verificationReport.push({
    check: 'Contract Implementation Integrity',
    passed: !classImplementGaps,
    message: !classImplementGaps
      ? 'All domain interface boundaries contracts are structurally valid.'
      : 'Some class boundary contracts interfaces lack matching local declarations.',
    severity: !classImplementGaps ? 'info' : 'warning',
  });

  // ── 5. Context Freshness Check ───────────────────────────
  const expectedArtifacts = [
    'AI_REPOSITORY_BRAIN.md',
    'AI_CONTEXT.md',
    'AI_QUICK.md',
    'AI_ARCHITECTURE.md',
    'AI_RUNTIME.md',
    'AI_FEATURES.md',
    'AI_RISKS.md',
    'AI_SECURITY.md',
    'AI_VALIDATION.md',
  ];
  
  const staleStatus: StaleStatusEntry[] = [];
  let staleCount = 0;

  for (const artifact of expectedArtifacts) {
    const filePath = join(mockRoot, '.guardian', 'ai-pos', artifact);
    let stale = true;
    let mtime = new Date(0).toISOString();

    try {
      const stats = await fs.stat(filePath);
      stale = Date.now() - stats.mtimeMs > 24 * 60 * 60 * 1000; // Stale if older than 24h
      mtime = stats.mtime.toISOString();
    } catch {
      stale = true;
    }

    if (stale) staleCount++;

    staleStatus.push({
      artifact,
      stale,
      lastUpdated: mtime,
      reason: stale ? 'Artifact file does not exist or has expired freshness threshold (24h).' : undefined,
    });
  }

  verificationReport.push({
    check: 'Context Freshness',
    passed: staleCount === 0,
    message: staleCount === 0 
      ? 'All 9 context intelligence documents are fresh.'
      : `Found ${staleCount} stale or missing context intelligence documents.`,
    severity: staleCount === 0 ? 'info' : 'warning',
  });

  // ── 6. Confidence Score Mechanics ───────────────────────
  let confidenceScore = 100;
  confidenceScore -= brokenImportsCount * 15;
  confidenceScore -= unimplementedFeatures.length * 10;
  confidenceScore -= untestedFeatures.length * 10;
  
  confidenceScore = Math.max(10, Math.min(100, confidenceScore));

  return {
    confidenceScore,
    staleStatus,
    verificationReport,
    timestamp: new Date().toISOString(),
    generationDuration: Date.now() - startTime,
    artifactCount: expectedArtifacts.length,
    warnings,
  };
}
