// ============================================================
// @pgos/core — Context Types
// Type definitions for the Universal Context Engine
// ============================================================

export type ContextLevel = 'L0' | 'L1' | 'L2' | 'L3' | 'L4' | 'L5' | 'L6';

export interface ContextPackage {
  id: string;
  projectId: string;
  level: ContextLevel;
  content: ContextContent;
  tokenCount: number;
  compressedTokens?: number;
  version: number;
  hash: string;
  createdAt: Date;
}

export interface ContextContent {
  goal?: string;
  modules: ModuleContext[];
  architecture: ArchitectureContext;
  constraints: string[];
  codingStyle: CodingStyle;
  patterns: PatternContext[];
  history: HistoryEntry[];
  decisions: DecisionRecord[];
  dependencies: DependencyContext[];
  criticalComponents: CriticalComponent[];
  testingRules: TestingRule[];
  qualityRules: QualityRule[];
  policies: string[];
  codebaseGraph?: CodebaseGraph;
  // AI-POS extended intelligence (optional for backward compat)
  projectIdentity?: import('./ai-pos-types.js').ProjectIdentity;
  domainModel?: import('./ai-pos-types.js').DomainModel;
  architectureIntelligence?: import('./ai-pos-types.js').ArchitectureIntelligence;
  executionFlows?: import('./ai-pos-types.js').ExecutionFlows;
  featureMatrix?: import('./ai-pos-types.js').FeatureMatrix;
  apiIntelligence?: import('./ai-pos-types.js').APIIntelligence;
  dataIntelligence?: import('./ai-pos-types.js').DataIntelligence;
  configIntelligence?: import('./ai-pos-types.js').ConfigIntelligence;
  securityIntelligence?: import('./ai-pos-types.js').SecurityIntelligence;
  performanceIntelligence?: import('./ai-pos-types.js').PerformanceIntelligence;
  observabilityIntelligence?: import('./ai-pos-types.js').ObservabilityIntelligence;
  technicalDebt?: import('./ai-pos-types.js').TechnicalDebtInventory;
  safetyClassification?: import('./ai-pos-types.js').SafetyClassification;
  aiEditRules?: import('./ai-pos-types.js').AIEditRules;
  riskIntelligence?: import('./ai-pos-types.js').RiskIntelligence;
  validationIntelligence?: import('./ai-pos-types.js').ValidationIntelligence;
  memoryState?: import('./ai-pos-types.js').ProjectMemoryState;
  navigationMap?: import('./ai-pos-types.js').AINavigationMap;
}

export interface CodebaseGraph {
  nodes: CodebaseNode[];
  edges: CodebaseEdge[];
}

export interface CodebaseNode {
  id: string;
  label: string;
  type: 'file' | 'function' | 'class' | 'interface' | 'module' | 'package';
  loc?: number;
  language?: string;
}

export interface CodebaseEdge {
  source: string;
  target: string;
  type: 'import' | 'contains' | 'extends' | 'implements' | 'calls';
}

export interface ModuleContext {
  name: string;
  purpose: string;
  publicApi: string[];
  dependencies: string[];
  patterns: string[];
  constraints: string[];
}

export interface ArchitectureContext {
  layers: ArchitectureLayer[];
  patterns: string[];
  principles: string[];
  constraints: string[];
  dataFlow: DataFlowEntry[];
}

export interface ArchitectureLayer {
  name: string;
  components: string[];
  allowedDependencies: string[];
  forbiddenDependencies: string[];
}

export interface DataFlowEntry {
  from: string;
  to: string;
  type: string;
  protocol?: string;
}

export interface CodingStyle {
  indentation: 'tabs' | 'spaces';
  indentSize: number;
  namingConvention: string;
  fileOrganization: string;
  importStyle: string;
  commentStyle: string;
  patterns: string[];
}

export interface PatternContext {
  name: string;
  description: string;
  locations: string[];
  examples: string[];
}

export interface HistoryEntry {
  timestamp: Date;
  type: string;
  summary: string;
  impact: string;
  relatedFiles: string[];
}

export interface DecisionRecord {
  id: string;
  title: string;
  context: string;
  decision: string;
  rationale: string;
  consequences: string[];
  date: Date;
  status: 'active' | 'superseded' | 'deprecated';
}

export interface DependencyContext {
  name: string;
  version: string;
  type: 'production' | 'development' | 'peer' | 'optional';
  purpose: string;
  critical: boolean;
}

export interface CriticalComponent {
  name: string;
  path: string;
  reason: string;
  protectionLevel: 'high' | 'medium' | 'low';
  dependencies: string[];
}

export interface TestingRule {
  scope: string;
  type: string;
  requirement: string;
  minCoverage?: number;
}

export interface QualityRule {
  name: string;
  description: string;
  severity: 'info' | 'warning' | 'error';
  check: string;
}

export interface ContextCompilationOptions {
  levels: ContextLevel[];
  maxTokens?: number;
  includeHistory?: boolean;
  includeTests?: boolean;
  taskScope?: string;
  activeFiles?: string[];
}

export interface ContextExportOptions {
  targetModel: string;
  format: 'yaml' | 'json' | 'markdown' | 'xml';
  maxTokens: number;
  includeExamples?: boolean;
  compressionLevel?: 'none' | 'light' | 'aggressive';
}

export interface CompiledContext {
  projectId: string;
  levels: Map<ContextLevel, ContextPackage>;
  totalTokens: number;
  optimizedTokens: number;
  reductionPercent: number;
  compiledAt: Date;
}
