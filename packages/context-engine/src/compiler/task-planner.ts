// ============================================================
// @pgos/context-engine — Autonomous Task Planning Engine
// Formulates technical plans, rollback checklists, validation criteria,
// complexity ratings, and execution sequences for AI request operations.
// ============================================================

export interface TaskBlueprint {
  goal: string;
  requiredFiles: string[];
  dependencies: string[];
  implementationPlan: string[];
  testPlan: string[];
  validationPlan: string[];
  rollbackPlan: string[];
  executionOrder: string[];
  metrics: {
    complexity: 'low' | 'medium' | 'high';
    effortEstimates: string;
    riskScore: number;
    riskClassification: 'low' | 'medium' | 'high' | 'critical';
  };
}

/**
 * Synthesizes an autonomous execution blueprint for a developer or AI request.
 */
export function formulateTaskBlueprint(
  request: string,
  allFiles: string[]
): TaskBlueprint {
  const goal = `Fulfill user request: "${request.substring(0, 80)}..."`;
  const requiredFiles: string[] = [];
  const dependencies: string[] = [];
  const implementationPlan: string[] = [];
  const testPlan: string[] = [];
  const validationPlan: string[] = [];
  const rollbackPlan: string[] = [];
  const executionOrder: string[] = [];

  // Match target files based on standard name keywords in the codebase
  if (/auth|login|security/i.test(request)) {
    const authFile = allFiles.find(f => f.includes('auth') || f.includes('security'));
    if (authFile) requiredFiles.push(authFile);
    implementationPlan.push('Update authentication configuration and trust boundary mappings.');
    testPlan.push('Execute security middleware tests.');
    validationPlan.push('Assert token validation rules and verify no hardcoded secret keys are exposed.');
    rollbackPlan.push('Revert security configuration files to the stable Git index commit.');
    executionOrder.push('Stage 1: Edit configuration. Stage 2: Verify imports. Stage 3: Run regression test suite.');
  } else {
    // Default task template matching general requests
    const contextEngineIndex = allFiles.find(f => f.includes('index.ts') && f.includes('context-engine'));
    if (contextEngineIndex) requiredFiles.push(contextEngineIndex);
    implementationPlan.push('Extend core exports and verify type boundaries.');
    testPlan.push('Run context compiler E2E integration validations.');
    validationPlan.push('Verify typecheck completes successfully across all workspace dependencies.');
    rollbackPlan.push('Hard reset target modified directories using git checkout.');
    executionOrder.push('Stage 1: Apply type modifications. Stage 2: Compile typechecking check. Stage 3: Push main branch.');
  }

  // Calculate complexity and risk scores
  let riskScore = 20;
  if (/auth|database|delete|schema|config/i.test(request)) {
    riskScore += 45;
  }
  const isHighRisk = riskScore >= 60;
  const riskClassification = riskScore >= 75 ? 'critical' : riskScore >= 50 ? 'high' : riskScore >= 30 ? 'medium' : 'low';
  const complexity = riskScore >= 60 ? 'high' : riskScore >= 30 ? 'medium' : 'low';
  const effortEstimates = riskScore >= 60 ? '3-5 Days' : riskScore >= 30 ? '1-2 Days' : 'Hours';

  return {
    goal,
    requiredFiles,
    dependencies,
    implementationPlan,
    testPlan,
    validationPlan,
    rollbackPlan,
    executionOrder,
    metrics: {
      complexity,
      effortEstimates,
      riskScore,
      riskClassification,
    },
  };
}
