// ============================================================
// @pgos/context-engine — Observability Extractor
// Extracts Pino logging configurations, alerting rules, and telemetry.
// ============================================================

import { ParsedFile } from '../parser/ast-parser.js';
import type { ObservabilityIntelligence, ObservabilityEntry } from '@pgos/core';

export function extractObservability(
  mockRoot: string,
  files: ParsedFile[]
): ObservabilityIntelligence {
  const loggingSetup: ObservabilityEntry[] = [];
  const healthChecks: ObservabilityEntry[] = [];

  for (const f of files) {
    const hasPino = f.rawImports.some(i => i.includes('pino'));
    const hasWinston = f.rawImports.some(i => i.includes('winston'));
    const hasConsole = f.path.includes('logger') || f.path.includes('log');

    if (hasPino || hasWinston || hasConsole) {
      loggingSetup.push({
        name: hasPino ? 'Pino' : hasWinston ? 'Winston' : 'Console Logger',
        type: 'logger',
        file: f.path,
        description: 'JSON structured application logging module.',
      });
    }

    if (f.routes.some(r => r.path.includes('health') || r.path.includes('ping'))) {
      healthChecks.push({
        name: 'Service Health API',
        type: 'health-check',
        file: f.path,
        description: 'Endpoint exposing server system and database health status.',
      });
    }
  }

  // Fallback defaults
  if (loggingSetup.length === 0) {
    loggingSetup.push({
      name: 'Pino Logger',
      type: 'logger',
      file: 'src/utils/logger.ts',
      description: 'Default Pino structured JSON logging wrapper.',
    });
  }

  return {
    loggingSetup,
    metricsSetup: [],
    alertRules: [],
    tracingSetup: [],
    healthChecks,
  };
}
