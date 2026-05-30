// ============================================================
// @pgos/context-engine — Graph Generators
// Exports JSON schemas for structural relationships models.
// ============================================================

import type { ProjectIntelligence } from '@pgos/core';

export function generateDependencyGraph(intel: ProjectIntelligence): any {
  return {
    _meta: { type: 'dependency-graph', version: '1.0.0' },
    layers: intel.architecture.layers,
    communication: intel.architecture.communication,
  };
}

export function generateImportGraph(intel: ProjectIntelligence): any {
  return {
    _meta: { type: 'import-graph', version: '1.0.0' },
    nodes: intel.domainModel.entities.map(e => ({ id: e.name, type: e.type, source: e.sourceFile })),
    edges: intel.domainModel.relations,
  };
}

export function generateServiceGraph(intel: ProjectIntelligence): any {
  return {
    _meta: { type: 'service-graph', version: '1.0.0' },
    services: intel.architecture.boundaries.map(b => ({ name: b.name, boundary: b.type, api: b.publicApi })),
  };
}

export function generateChangeGraphJson(intel: ProjectIntelligence): any {
  return {
    _meta: { type: 'change-graph', version: '1.0.0' },
    blastRadius: intel.riskIntelligence.blastRadiusMap,
  };
}

export function generateRuntimeGraph(intel: ProjectIntelligence): any {
  return {
    _meta: { type: 'runtime-graph', version: '1.0.0' },
    startup: intel.executionFlows.startup,
    request: intel.executionFlows.request,
  };
}

export function generateFeatureGraph(intel: ProjectIntelligence): any {
  return {
    _meta: { type: 'feature-graph', version: '1.0.0' },
    nodes: intel.featureMatrix.features.map(f => ({ name: f.name, filesCount: f.files.length, status: f.status })),
  };
}
