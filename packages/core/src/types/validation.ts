// ============================================================
// @pgos/core — Validation Types
// Type definitions for the Validation Engine
// ============================================================

export interface ValidationResult {
  id: string;
  projectId: string;
  snapshotId?: string;
  type: ValidationType;
  status: ValidationStatus;
  score: number;
  results: ValidationDetail[];
  requirements?: RequirementValidation[];
  createdAt: Date;
}

export type ValidationType =
  | 'completion'
  | 'architecture'
  | 'hallucination'
  | 'security'
  | 'quality'
  | 'tests'
  | 'full';

export type ValidationStatus = 'pass' | 'fail' | 'warning' | 'partial' | 'error';

export interface ValidationDetail {
  rule: string;
  passed: boolean;
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  file?: string;
  line?: number;
  suggestion?: string;
  confidence: number;
}

export interface RequirementValidation {
  requirement: string;
  status: RequirementStatus;
  implementedIn: string[];
  completeness: number;
  issues: string[];
}

export type RequirementStatus = 'complete' | 'partial' | 'absent' | 'stub' | 'mocked';

export interface CompletionScore {
  overall: number;
  requirements: RequirementScore[];
  antiPatterns: AntiPattern[];
  totalRequirements: number;
  completedRequirements: number;
  partialRequirements: number;
  absentRequirements: number;
}

export interface RequirementScore {
  name: string;
  score: number;
  status: RequirementStatus;
  evidence: string[];
  blockers: string[];
}

export interface AntiPattern {
  type: AntiPatternType;
  file: string;
  line: number;
  content: string;
  severity: 'warning' | 'error' | 'critical';
  suggestion: string;
}

export type AntiPatternType =
  | 'todo'
  | 'fixme'
  | 'hack'
  | 'not_implemented'
  | 'mock_logic'
  | 'placeholder'
  | 'hardcoded'
  | 'stub'
  | 'empty_function'
  | 'commented_code'
  | 'pass_statement'
  | 'throw_not_implemented';

export interface HallucinationResult {
  score: number;
  issues: HallucinationIssue[];
  validated: number;
  total: number;
}

export interface HallucinationIssue {
  type: HallucinationType;
  file: string;
  line: number;
  content: string;
  confidence: number;
  explanation: string;
  suggestion: string;
}

export type HallucinationType =
  | 'invalid_import'
  | 'nonexistent_api'
  | 'fake_sdk'
  | 'wrong_config'
  | 'unsupported_method'
  | 'hallucinated_dependency'
  | 'invalid_version'
  | 'nonexistent_module';

export interface ArchitectureValidation {
  score: number;
  fingerprint: string;
  drift: ArchitectureDrift[];
  violations: ArchitectureViolation[];
  preservedLayers: number;
  totalLayers: number;
}

export interface ArchitectureDrift {
  type: 'layer_added' | 'layer_removed' | 'dependency_added' | 'dependency_removed' | 'component_moved';
  description: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  before: string;
  after: string;
}

export interface ArchitectureViolation {
  rule: string;
  description: string;
  file: string;
  severity: 'warning' | 'error' | 'critical';
  suggestion: string;
}

export interface ValidationRunOptions {
  types?: ValidationType[];
  requirements?: string[];
  strictMode?: boolean;
  failThreshold?: number;
  includeFiles?: string[];
  excludeFiles?: string[];
}
