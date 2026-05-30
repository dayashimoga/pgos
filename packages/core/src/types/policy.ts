// ============================================================
// @pgos/core — Policy Types
// Type definitions for the Policy Engine
// ============================================================

export interface Policy {
  id: string;
  projectId?: string;
  name: string;
  type: PolicyType;
  rules: PolicyRule[];
  severity: PolicySeverity;
  enabled: boolean;
  createdAt: Date;
}

export type PolicyType =
  | 'security'
  | 'architecture'
  | 'quality'
  | 'access'
  | 'model'
  | 'deployment'
  | 'testing'
  | 'naming'
  | 'custom';

export type PolicySeverity = 'info' | 'warning' | 'error' | 'critical';

export interface PolicyRule {
  id: string;
  name: string;
  description: string;
  condition: PolicyCondition;
  action: PolicyAction;
  metadata?: Record<string, unknown>;
}

export interface PolicyCondition {
  type: 'file_pattern' | 'code_pattern' | 'dependency' | 'metric' | 'architecture' | 'custom';
  operator: 'equals' | 'contains' | 'matches' | 'greater_than' | 'less_than' | 'exists' | 'not_exists';
  value: string | number | boolean;
  target?: string;
}

export type PolicyAction = 'allow' | 'warn' | 'block' | 'require_approval' | 'audit';

export interface PolicyEvaluation {
  policyId: string;
  policyName: string;
  passed: boolean;
  violations: PolicyViolation[];
  evaluatedAt: Date;
}

export interface PolicyViolation {
  ruleId: string;
  ruleName: string;
  severity: PolicySeverity;
  message: string;
  file?: string;
  line?: number;
  action: PolicyAction;
  suggestion?: string;
}

export interface RBACRole {
  id: string;
  name: string;
  permissions: Permission[];
}

export interface Permission {
  resource: string;
  actions: ('read' | 'write' | 'delete' | 'admin')[];
  conditions?: Record<string, unknown>;
}
