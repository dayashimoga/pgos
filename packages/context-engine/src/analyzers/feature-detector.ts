// ============================================================
// @pgos/context-engine — Feature Detector
// Groups route files, service handlers, and models into business features.
// ============================================================

import { ParsedFile } from '../parser/ast-parser.js';
import type { FeatureMatrix, FeatureEntry } from '@pgos/core';

export function detectFeatures(mockRoot: string, files: ParsedFile[]): FeatureMatrix {
  const features: FeatureEntry[] = [];
  const routeFiles = files.filter(f => f.routes.length > 0);

  // Group by endpoint routes paths first segment
  const routeGroups: Record<string, ParsedFile[]> = {};
  for (const f of routeFiles) {
    for (const r of f.routes) {
      const segs = r.path.split('/').filter(Boolean);
      const group = segs[1] || segs[0] || 'core';
      if (!routeGroups[group]) routeGroups[group] = [];
      if (!routeGroups[group].includes(f)) routeGroups[group].push(f);
    }
  }

  for (const [group, groupFiles] of Object.entries(routeGroups)) {
    const entryPoint = groupFiles[0]?.path || 'src/routes.ts';
    const associatedFiles = groupFiles.map(f => f.path);
    const testFiles = files.filter(t => t.hasTests && t.path.includes(group)).map(t => t.path);

    features.push({
      name: group.charAt(0).toUpperCase() + group.slice(1).replace(/[-_]/g, ' '),
      status: 'implemented',
      entryPoint,
      tests: testFiles,
      dependencies: [],
      coverage: testFiles.length > 0 ? 80 : 0,
      files: associatedFiles,
      description: `Inbound routing handlers and actions for ${group} requests.`,
    });
  }

  // Fallback defaults
  if (features.length === 0) {
    features.push({
      name: 'System Core',
      status: 'implemented',
      entryPoint: files.find(f => /main|app|index/i.test(f.path))?.path || 'src/index.ts',
      tests: files.filter(f => f.hasTests).map(f => f.path),
      dependencies: [],
      coverage: files.some(f => f.hasTests) ? 75 : 0,
      files: files.slice(0, 3).map(f => f.path),
      description: 'Central system bootstrap capabilities.',
    });
  }

  const implementedCount = features.filter(f => f.status === 'implemented').length;
  const testedCount = features.filter(f => f.tests.length > 0).length;

  return {
    features,
    totalFeatures: features.length,
    implementedCount,
    testedCount,
    documentedCount: features.length, // Assume fully self-documented
  };
}
