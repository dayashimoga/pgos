// ============================================================
// @pgos/architecture-guard — Entry Point
// Infer, fingerprint, and protect project architecture
// ============================================================

import { readFile } from 'fs/promises';
import { join, relative } from 'path';
import {
  type ArchitectureValidation,
  type ArchitectureDrift,
  type ArchitectureViolation,
  listFilesRecursive,
  isBinaryFile,
  sha256,
  componentLogger,
} from '@pgos/core';

const log = componentLogger('architecture-guard');

export interface ArchitectureFingerprint {
  id: string;
  projectId: string;
  layers: LayerFingerprint[];
  rules: ArchitectureRule[];
  hash: string;
  createdAt: Date;
}

export interface LayerFingerprint {
  name: string;
  directories: string[];
  filePatterns: string[];
  fileCount: number;
  entryPoints: string[];
}

export interface ArchitectureRule {
  name: string;
  type: 'no_direct_access' | 'preserve_layer' | 'no_circular' | 'required_component';
  source?: string;
  target?: string;
  description: string;
}

/**
 * Infer architecture from project structure
 */
export async function inferArchitecture(rootPath: string): Promise<ArchitectureFingerprint> {
  log.info({ rootPath }, 'Inferring architecture');

  const files = await listFilesRecursive(rootPath);
  const sourceFiles = files.filter((f) => !isBinaryFile(f));

  // Map files to layers
  const layerMap = new Map<string, string[]>();

  for (const file of sourceFiles) {
    const rel = relative(rootPath, file).replace(/\\/g, '/');
    const topDir = rel.split('/')[0] || 'root';

    if (!layerMap.has(topDir)) layerMap.set(topDir, []);
    layerMap.get(topDir)!.push(rel);
  }

  const layers: LayerFingerprint[] = Array.from(layerMap.entries()).map(([name, files]) => ({
    name,
    directories: [name],
    filePatterns: [...new Set(files.map((f) => f.split('.').pop() || ''))],
    fileCount: files.length,
    entryPoints: files.filter((f) => /index\.|main\.|app\.|server\./.test(f)),
  }));

  // Generate default rules
  const rules = generateDefaultRules(layers);

  const fingerprint: ArchitectureFingerprint = {
    id: '',
    projectId: '',
    layers,
    rules,
    hash: sha256(JSON.stringify(layers)),
    createdAt: new Date(),
  };

  log.info({ layers: layers.length, rules: rules.length }, 'Architecture inferred');

  return fingerprint;
}

/**
 * Validate architecture against fingerprint
 */
export async function validateArchitecture(
  rootPath: string,
  baseline: ArchitectureFingerprint
): Promise<ArchitectureValidation> {
  const current = await inferArchitecture(rootPath);
  const drift = detectDrift(baseline, current);
  const violations = checkViolations(current, baseline.rules);

  const preservedLayers = baseline.layers.filter((bl) =>
    current.layers.some((cl) => cl.name === bl.name)
  ).length;

  const score = baseline.layers.length > 0
    ? Math.round((preservedLayers / baseline.layers.length) * 100)
    : 100;

  return {
    score,
    fingerprint: current.hash,
    drift,
    violations,
    preservedLayers,
    totalLayers: baseline.layers.length,
  };
}

/**
 * Detect architecture drift between baseline and current
 */
function detectDrift(
  baseline: ArchitectureFingerprint,
  current: ArchitectureFingerprint
): ArchitectureDrift[] {
  const drift: ArchitectureDrift[] = [];

  const baselineNames = new Set(baseline.layers.map((l) => l.name));
  const currentNames = new Set(current.layers.map((l) => l.name));

  // Check for removed layers
  for (const name of baselineNames) {
    if (!currentNames.has(name)) {
      drift.push({
        type: 'layer_removed',
        description: `Layer "${name}" was removed`,
        severity: 'critical',
        before: name,
        after: '',
      });
    }
  }

  // Check for added layers
  for (const name of currentNames) {
    if (!baselineNames.has(name)) {
      drift.push({
        type: 'layer_added',
        description: `New layer "${name}" was added`,
        severity: 'info',
        before: '',
        after: name,
      });
    }
  }

  return drift;
}

/**
 * Check architecture rule violations
 */
function checkViolations(
  current: ArchitectureFingerprint,
  rules: ArchitectureRule[]
): ArchitectureViolation[] {
  const violations: ArchitectureViolation[] = [];

  for (const rule of rules) {
    if (rule.type === 'required_component') {
      const exists = current.layers.some((l) => l.name === rule.target);
      if (!exists) {
        violations.push({
          rule: rule.name,
          description: `Required component "${rule.target}" is missing`,
          file: '',
          severity: 'critical',
          suggestion: `Ensure the "${rule.target}" component exists in the project`,
        });
      }
    }
  }

  return violations;
}

/**
 * Generate default architecture rules
 */
function generateDefaultRules(layers: LayerFingerprint[]): ArchitectureRule[] {
  const rules: ArchitectureRule[] = [];

  for (const layer of layers) {
    rules.push({
      name: `preserve_${layer.name}`,
      type: 'preserve_layer',
      target: layer.name,
      description: `Layer "${layer.name}" must be preserved`,
    });
  }

  return rules;
}
