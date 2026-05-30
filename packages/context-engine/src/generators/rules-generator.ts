// ============================================================
// @pgos/context-engine — Dynamic Rules Generator
// Generates contextual ALWAYS/NEVER/BEFORE/AFTER rules for IDE assistants.
// ============================================================

import type { ProjectIntelligence } from '@pgos/core';

export function generateRules(intel: ProjectIntelligence): any {
  const language = intel.projectIdentity.primaryLanguage.toLowerCase();
  const framework = intel.projectIdentity.framework?.toLowerCase() || 'plain';
  
  const always = [...intel.aiEditRules.always];
  const never = [...intel.aiEditRules.never];
  const beforeEdit = [...intel.aiEditRules.beforeEdit];
  const afterEdit = [...intel.aiEditRules.afterEdit];

  // Language specific rules
  if (language.includes('typescript') || language.includes('ts')) {
    always.push('Ensure strict TypeScript type check safety parameters validation.');
  }

  // Framework specific rules
  if (framework.includes('fastify')) {
    always.push('Confirm Fastify route schema definitions parameters match runtime shapes.');
  }

  // Monorepo specific rules
  if (intel.projectIdentity.repoType === 'monorepo') {
    always.push('Verify workspaces package inter-dependencies constraints boundaries.');
  }

  // Risk warnings in beforeEdit
  const criticalCount = intel.safetyClassification.criticalFiles.length;
  if (criticalCount > 0) {
    beforeEdit.push(`Verify the safety zone classification. Repository contains ${criticalCount} CRITICAL files.`);
  }

  return {
    always,
    never,
    beforeEdit,
    afterEdit,
  };
}
