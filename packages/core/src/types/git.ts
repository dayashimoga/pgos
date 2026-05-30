// ============================================================
// @pgos/core — Semantic Git Types
// Type definitions for the Semantic Git Layer
// ============================================================

export interface SemanticCommit {
  id: string;
  projectId: string;
  sessionId?: string;
  gitSha?: string;
  semanticType: SemanticChangeType;
  impactAreas: ImpactArea[];
  changes: SemanticChange[];
  riskScore: number;
  validated: boolean;
  createdAt: Date;
}

export type SemanticChangeType =
  | 'feature'
  | 'fix'
  | 'refactor'
  | 'architecture'
  | 'security'
  | 'performance'
  | 'test'
  | 'docs'
  | 'dependency'
  | 'config'
  | 'style';

export interface ImpactArea {
  layer: string;
  component: string;
  severity: 'none' | 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

export interface SemanticChange {
  file: string;
  type: 'added' | 'modified' | 'deleted' | 'renamed';
  semanticImpact: string;
  categories: SemanticCategory[];
  linesAdded: number;
  linesRemoved: number;
}

export type SemanticCategory =
  | 'security_changed'
  | 'architecture_drift'
  | 'tests_removed'
  | 'tests_added'
  | 'performance_impacted'
  | 'api_changed'
  | 'schema_changed'
  | 'config_changed'
  | 'dependency_updated'
  | 'critical_component_modified'
  | 'telemetry_removed'
  | 'error_handling_changed';

export interface SemanticDiff {
  fromCommit: string;
  toCommit: string;
  semanticChanges: SemanticChange[];
  impactSummary: ImpactSummary;
  riskAssessment: RiskAssessment;
}

export interface ImpactSummary {
  totalFiles: number;
  securityImpact: boolean;
  architectureImpact: boolean;
  testImpact: boolean;
  performanceImpact: boolean;
  breakingChanges: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface RiskAssessment {
  overall: number;
  factors: RiskFactor[];
  recommendation: 'proceed' | 'review' | 'block';
}

export interface RiskFactor {
  name: string;
  score: number;
  description: string;
}

export interface SemanticHistory {
  commits: SemanticCommit[];
  total: number;
  timeline: TimelineEntry[];
}

export interface TimelineEntry {
  date: Date;
  type: string;
  summary: string;
  commitId: string;
  risk: number;
}
