// ============================================================
// @pgos/context-engine — Intelligence Generators
// Generates machine-readable indices, memories, debt lists, and validation.
// ============================================================

import type { ProjectIntelligence } from '@pgos/core';

export function generateIndexJson(intel: ProjectIntelligence): any {
  return {
    _meta: { type: 'ai-pos-index', version: '2.0.0' },
    project: {
      name: intel.projectIdentity.name,
      files: intel.projectIdentity.totalFiles,
      loc: intel.projectIdentity.totalLoc,
      primaryLanguage: intel.projectIdentity.primaryLanguage,
    },
    endpoints: intel.apiIntelligence.endpoints.length,
    risk: intel.riskIntelligence.overallRiskScore,
    navigation: intel.navigationMap,
    artifacts: {
      markdown: [
        { file: 'AI_REPOSITORY_BRAIN.md', type: 'master' },
        { file: 'AI_CONTEXT.md', type: 'context' },
        { file: 'AI_ARCHITECTURE.md', type: 'architecture' },
        { file: 'AI_RUNTIME.md', type: 'runtime' },
        { file: 'AI_RISKS.md', type: 'risks' },
      ],
    },
  };
}

export function generateTechDebtJson(intel: ProjectIntelligence): any {
  return {
    _meta: { type: 'tech-debt', version: '1.0.0' },
    summary: {
      totalCount: intel.technicalDebt.totalCount,
      criticalCount: intel.technicalDebt.criticalCount,
      estimatedEffort: intel.technicalDebt.estimatedEffort,
    },
    items: intel.technicalDebt.items,
  };
}

export function generateSemanticChunksJson(intel: ProjectIntelligence): any {
  // Extract chunks from domain entities, endpoints, features
  const chunks: any[] = [];
  
  intel.domainModel.entities.forEach((e, idx) => {
    chunks.push({
      chunkId: `chunk-domain-entity-${idx}`,
      source: e.sourceFile,
      type: 'domain-entity',
      semanticContent: `Domain Entity **${e.name}** is a ${e.type} defined in \`${e.sourceFile}\`. Description: ${e.description}`,
    });
  });

  intel.apiIntelligence.endpoints.forEach((ep, idx) => {
    chunks.push({
      chunkId: `chunk-api-endpoint-${idx}`,
      source: ep.file,
      type: 'api-endpoint',
      semanticContent: `API Endpoint **${ep.method} ${ep.path}** resolves to handler \`${ep.handler}\` in \`${ep.file}\` (Authentication requirement: ${ep.auth}).`,
    });
  });

  intel.featureMatrix.features.forEach((f, idx) => {
    chunks.push({
      chunkId: `chunk-feature-${idx}`,
      source: f.entryPoint,
      type: 'feature',
      semanticContent: `Business Feature **${f.name}** is ${f.status} with entryPoint \`${f.entryPoint}\`. Description: ${f.description || 'N/A'}. Files involved: ${f.files.join(', ')}.`,
    });
  });

  return {
    _meta: { type: 'semantic-chunks', version: '1.0.0' },
    count: chunks.length,
    chunks,
  };
}

export function generateMemoryJson(intel: ProjectIntelligence): any {
  return {
    _meta: { type: 'project-memory', version: '1.0.0' },
    historicalDecisions: intel.memoryState.historicalDecisions,
    rejectedIdeas: intel.memoryState.rejectedIdeas,
    activeWork: intel.memoryState.activeWork,
    plannedWork: intel.memoryState.plannedWork,
    knownFailures: intel.memoryState.knownFailures,
    lessonsLearned: intel.memoryState.lessonsLearned,
    roadmap: intel.memoryState.roadmap,
  };
}

export function generateValidationJson(intel: ProjectIntelligence): any {
  return {
    _meta: { type: 'validation-report', version: '1.0.0' },
    confidenceScore: intel.validationIntelligence.confidenceScore,
    staleStatus: intel.validationIntelligence.staleStatus,
    verificationReport: intel.validationIntelligence.verificationReport,
    warnings: intel.validationIntelligence.warnings,
  };
}
