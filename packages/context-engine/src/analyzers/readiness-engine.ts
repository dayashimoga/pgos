// ============================================================
// @pgos/context-engine — Production Readiness Engine
// Evaluates repository readiness scores against professional checklists
// including Security, Reliability, Testing, Performance, and Recovery.
// ============================================================

import { ParsedFile } from '../parser/ast-parser.js';
import { CoverageTelemetry } from './test-intelligence.js';

export interface ProductionReadiness {
  securityScore: number;
  reliabilityScore: number;
  testingScore: number;
  observabilityScore: number;
  performanceScore: number;
  scalabilityScore: number;
  recoveryScore: number;
  overallReadiness: number;
  passed: boolean;
  issues: string[];
}

/**
 * Calculates overall Production Readiness scores based on source file metrics and coverage.
 */
export function evaluateReadiness(
  files: ParsedFile[],
  coverage: CoverageTelemetry,
  securityVulnerabilitiesCount: number,
  circularDependenciesCount: number
): ProductionReadiness {
  const issues: string[] = [];

  // 1. Security Score (OWASP recommendations, sensitive keys, leaks)
  let securityScore = 100;
  if (securityVulnerabilitiesCount > 0) {
    securityScore -= securityVulnerabilitiesCount * 15;
    issues.push(`Security: ${securityVulnerabilitiesCount} vulnerability indicators detected.`);
  }
  const hardcodedSecrets = files.flatMap(f => f.envVars.filter(e => e.sensitive));
  if (hardcodedSecrets.length > 5) {
    securityScore -= 10;
    issues.push(`Security: Multiple sensitive environment variables mapped without secrets manager.`);
  }
  securityScore = Math.max(20, securityScore);

  // 2. Reliability Score (error handling, bounds, coupling)
  let reliabilityScore = 100;
  if (circularDependenciesCount > 0) {
    reliabilityScore -= Math.min(30, circularDependenciesCount * 5);
    issues.push(`Reliability: ${circularDependenciesCount} circular cycles can compromise loading/reliability.`);
  }
  const complexFiles = files.filter(f => f.functions.length > 15);
  if (complexFiles.length > 0) {
    reliabilityScore -= Math.min(20, complexFiles.length * 4);
    issues.push(`Reliability: ${complexFiles.length} files exceed 15 function definitions.`);
  }
  reliabilityScore = Math.max(30, reliabilityScore);

  // 3. Testing Score
  const testingScore = Math.round(coverage.overallCoverage);
  if (testingScore < 90) {
    issues.push(`Testing: Overall coverage is ${testingScore}%, failing target of 90%.`);
  }

  // 4. Observability Score (logging, tracing, dashboards)
  let observabilityScore = 80;
  const loggingFilesCount = files.filter(f => f.imports.some(i => /pino|winston|logger/i.test(i.source))).length;
  if (loggingFilesCount > 0) {
    observabilityScore += Math.min(20, Math.round((loggingFilesCount / files.length) * 100));
  }
  observabilityScore = Math.min(100, observabilityScore);
  if (observabilityScore < 90) {
    issues.push(`Observability: Low standard logger distribution (${loggingFilesCount} files).`);
  }

  // 5. Performance Score (bottlenecks, query indexes)
  let performanceScore = 95;
  const syncIOCalls = files.filter(f => f.functions.some(fn => !fn.isAsync && /readFileSync|writeFileSync|execSync/i.test(fn.name))).length;
  if (syncIOCalls > 0) {
    performanceScore -= 15;
    issues.push('Performance: Synchronous I/O operations detected in active execution paths.');
  }

  // 6. Scalability & Recovery Score
  const scalabilityScore = files.some(f => f.imports.some(i => /redis|kafka|bullmq|rabbitmq/i.test(i.source))) ? 95 : 90;
  const recoveryScore = files.some(f => f.path.includes('recovery') || f.path.includes('retry') || f.path.includes('resilient')) ? 92 : 88;

  // 7. Overall Readiness Calculation
  const overallReadiness = Math.round(
    (securityScore + reliabilityScore + testingScore + observabilityScore + performanceScore + scalabilityScore + recoveryScore) / 7
  );

  const passed = overallReadiness >= 90;

  return {
    securityScore,
    reliabilityScore,
    testingScore,
    observabilityScore,
    performanceScore,
    scalabilityScore,
    recoveryScore,
    overallReadiness,
    passed,
    issues,
  };
}
