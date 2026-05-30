// ============================================================
// @pgos/context-engine — Risk Analyzer
// Analyzes project risk vectors, spofs, circulars, and coupling maps.
// ============================================================

import { ParsedFile } from '../parser/ast-parser.js';
import type { RiskIntelligence } from '@pgos/core';
import type { DependencyGraph } from '../parser/dependency-parser.js';

export function analyzeRisks(
  mockRoot: string,
  files: ParsedFile[],
  depGraph: DependencyGraph
): RiskIntelligence {
  const criticalFiles = files.filter(f => f.zone === 'critical').map(f => f.path);
  const singlePointsOfFailure = depGraph.spofs.map(s => s.path);
  const untestedPaths = files.filter(f => !f.hasTests && f.zone !== 'safe').map(f => f.path);

  // Compute blast radius map
  const blastRadiusMap = files
    .filter(f => f.zone !== 'safe')
    .map(f => {
      const dependents = depGraph.inDegree[f.path] || 0;
      const score = dependents * 3 + (f.zone === 'critical' ? 15 : 5);
      return {
        file: f.path,
        dependentCount: dependents,
        affectedModules: [f.path.split('/')[0]],
        riskLevel: score >= 20 ? ('critical' as const) : score >= 10 ? ('high' as const) : ('medium' as const),
      };
    });

  const totalFiles = files.length || 1;
  const riskFactors = [
    criticalFiles.length / totalFiles * 30,
    untestedPaths.length / totalFiles * 25,
    depGraph.circular.length * 8,
    singlePointsOfFailure.length / totalFiles * 15,
  ];
  const overallRiskScore = Math.min(100, Math.round(riskFactors.reduce((s, v) => s + v, 0)));

  return {
    blastRadiusMap,
    criticalFiles,
    unsafeEdits: criticalFiles.slice(0, 5).map(cf => ({
      file: cf,
      reason: 'Critical security or system component with missing complete test validation coverage',
      complexity: 8,
      testCoverage: files.find(f => f.path === cf)?.hasTests ? 80 : 0,
      recommendation: 'Write full integration and unit tests before editing this file',
    })),
    singlePointsOfFailure,
    untestedPaths: untestedPaths.slice(0, 15),
    overallRiskScore,
  };
}
