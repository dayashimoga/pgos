// ============================================================
// @pgos/core — AI Project Operating System Types
// Type definitions for the next-gen AI-POS intelligence layer
// ============================================================

// ─── Architecture Patterns ──────────────────────────────────

export type ArchitecturePattern =
  | 'monolith'
  | 'microservices'
  | 'ddd'
  | 'clean-architecture'
  | 'layered'
  | 'event-driven'
  | 'cqrs'
  | 'hexagonal'
  | 'plugin'
  | 'serverless'
  | 'modular-monolith'
  | 'unknown';

// ─── Project Identity ───────────────────────────────────────

export interface ProjectIdentity {
  name: string;
  summary: string;
  goals: string[];
  nonGoals: string[];
  maturity: 'prototype' | 'alpha' | 'beta' | 'production' | 'legacy';
  status: 'active' | 'maintenance' | 'archived' | 'deprecated';
  priorities: string[];
  primaryLanguage: string;
  languages: Record<string, number>;
  framework?: string;
  buildSystem?: string;
  repoType: 'monorepo' | 'polyrepo' | 'single';
  packageManager?: string;
  totalFiles: number;
  totalLoc: number;
}

// ─── Domain Model ───────────────────────────────────────────

export interface DomainModel {
  entities: DomainEntity[];
  relations: DomainRelation[];
  constraints: string[];
  invariants: string[];
  lifecycles: DomainLifecycle[];
  glossary: GlossaryEntry[];
}

export interface DomainEntity {
  name: string;
  type: 'aggregate' | 'entity' | 'value-object' | 'enum' | 'dto' | 'event' | 'command';
  properties: string[];
  sourceFile: string;
  description?: string;
}

export interface DomainRelation {
  from: string;
  to: string;
  type: 'has-many' | 'has-one' | 'belongs-to' | 'extends' | 'implements' | 'uses' | 'emits' | 'consumes';
  cardinality?: string;
}

export interface DomainLifecycle {
  entity: string;
  states: string[];
  transitions: { from: string; to: string; trigger: string }[];
}

export interface GlossaryEntry {
  term: string;
  definition: string;
  source: string;
}

// ─── Architecture Intelligence ──────────────────────────────

export interface ArchitectureIntelligence {
  detectedPattern: ArchitecturePattern;
  confidence: number;
  evidence: string[];
  layers: ArchitectureLayerDetail[];
  communication: CommunicationPattern[];
  boundaries: BoundaryDefinition[];
  principles: string[];
}

export interface ArchitectureLayerDetail {
  name: string;
  purpose: string;
  directories: string[];
  components: string[];
  allowedDependencies: string[];
  forbiddenDependencies: string[];
  entryPoints: string[];
}

export interface CommunicationPattern {
  from: string;
  to: string;
  protocol: 'direct-call' | 'http' | 'grpc' | 'event' | 'message-queue' | 'websocket' | 'ipc';
  description: string;
}

export interface BoundaryDefinition {
  name: string;
  type: 'module' | 'service' | 'layer' | 'domain' | 'package';
  components: string[];
  publicApi: string[];
}

// ─── Execution Flows ────────────────────────────────────────

export interface ExecutionFlows {
  startup: ExecutionFlow;
  request: ExecutionFlow;
  failure: ExecutionFlow;
  recovery: ExecutionFlow;
  shutdown: ExecutionFlow;
}

export interface ExecutionFlow {
  name: string;
  description: string;
  steps: ExecutionStep[];
  entryPoint?: string;
  diagram?: string;
}

export interface ExecutionStep {
  order: number;
  action: string;
  file: string;
  function?: string;
  description: string;
  async: boolean;
}

// ─── Feature Matrix ─────────────────────────────────────────

export interface FeatureMatrix {
  features: FeatureEntry[];
  totalFeatures: number;
  implementedCount: number;
  testedCount: number;
  documentedCount: number;
}

export interface FeatureEntry {
  name: string;
  status: 'implemented' | 'partial' | 'planned' | 'deprecated' | 'experimental';
  owner?: string;
  entryPoint: string;
  tests: string[];
  dependencies: string[];
  coverage: number;
  files: string[];
  description?: string;
}

// ─── API Intelligence ───────────────────────────────────────

export interface APIIntelligence {
  endpoints: APIEndpoint[];
  schemas: APISchema[];
  authPatterns: string[];
  errorPatterns: string[];
  rateLimiting: boolean;
  versioning?: string;
  websocketChannels?: string[];
}

export interface APIEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD';
  path: string;
  handler: string;
  file: string;
  auth: boolean;
  requestSchema?: string;
  responseSchema?: string;
  description?: string;
}

export interface APISchema {
  name: string;
  file: string;
  type: 'request' | 'response' | 'model' | 'event';
  fields: string[];
}

// ─── Data Intelligence ──────────────────────────────────────

export interface DataIntelligence {
  tables: DataTable[];
  indexes: string[];
  migrations: MigrationEntry[];
  ormUsed?: string;
}

export interface DataTable {
  name: string;
  columns: string[];
  file: string;
  relations: string[];
}

export interface MigrationEntry {
  name: string;
  file: string;
  timestamp?: string;
  type: 'create' | 'alter' | 'drop' | 'seed' | 'unknown';
}

// ─── Configuration Intelligence ─────────────────────────────

export interface ConfigIntelligence {
  envVars: EnvVarEntry[];
  featureFlags: FeatureFlag[];
  runtimeModes: string[];
  configFiles: ConfigFileEntry[];
}

export interface EnvVarEntry {
  name: string;
  required: boolean;
  defaultValue?: string;
  description?: string;
  usedIn: string[];
  sensitive: boolean;
}

export interface FeatureFlag {
  name: string;
  defaultValue: boolean | string;
  description?: string;
  file: string;
}

export interface ConfigFileEntry {
  path: string;
  format: 'json' | 'yaml' | 'toml' | 'env' | 'ini' | 'ts' | 'js';
  purpose: string;
}

// ─── Security Intelligence ──────────────────────────────────

export interface SecurityIntelligence {
  authMechanism: string[];
  permissionModel?: string;
  secretManagement: string[];
  inputValidation: SecurityBoundary[];
  corsConfig?: string;
  knownVulnerabilities: SecurityIssue[];
  securityBoundaries: string[];
}

export interface SecurityBoundary {
  type: 'auth-middleware' | 'input-validation' | 'output-sanitization' | 'rate-limiter' | 'csrf' | 'cors';
  file: string;
  description: string;
}

export interface SecurityIssue {
  type: 'hardcoded-secret' | 'missing-auth' | 'sql-injection-risk' | 'xss-risk' | 'insecure-dependency' | 'missing-validation';
  file: string;
  line?: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

// ─── Performance Intelligence ───────────────────────────────

export interface PerformanceIntelligence {
  bottlenecks: PerformanceBottleneck[];
  cachingPatterns: CachingPattern[];
  asyncPatterns: string[];
  databasePatterns: DatabasePattern[];
  bundleIndicators: BundleIndicator[];
}

export interface PerformanceBottleneck {
  type: 'sync-io' | 'n-plus-1' | 'missing-cache' | 'blocking-loop' | 'large-payload' | 'missing-index' | 'unoptimized-query';
  file: string;
  line?: number;
  description: string;
  severity: 'low' | 'medium' | 'high';
}

export interface CachingPattern {
  type: 'in-memory' | 'redis' | 'cdn' | 'http-cache' | 'memoization';
  file: string;
  description: string;
}

export interface DatabasePattern {
  type: 'query' | 'transaction' | 'migration' | 'connection-pool';
  file: string;
  description: string;
  risk: 'low' | 'medium' | 'high';
}

export interface BundleIndicator {
  name: string;
  type: 'large-dependency' | 'tree-shake-candidate' | 'dynamic-import' | 'code-split';
  file: string;
  description: string;
}

// ─── Observability Intelligence ─────────────────────────────

export interface ObservabilityIntelligence {
  metricsSetup: ObservabilityEntry[];
  loggingSetup: ObservabilityEntry[];
  alertRules: ObservabilityEntry[];
  tracingSetup: ObservabilityEntry[];
  healthChecks: ObservabilityEntry[];
}

export interface ObservabilityEntry {
  name: string;
  type: string;
  file: string;
  description: string;
}

// ─── Technical Debt ─────────────────────────────────────────

export interface TechnicalDebtInventory {
  items: TechnicalDebtItem[];
  totalCount: number;
  criticalCount: number;
  estimatedEffort: string;
}

export interface TechnicalDebtItem {
  type: 'todo' | 'fixme' | 'hack' | 'deprecated' | 'dead-code' | 'orphan-module' | 'missing-test' | 'stale-doc';
  file: string;
  line?: number;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  effort?: string;
}

// ─── Safety Classification ──────────────────────────────────

export type SafetyZone = 'safe' | 'caution' | 'critical' | 'do-not-modify';

export interface SafetyClassification {
  safeFiles: FileClassification[];
  cautionFiles: FileClassification[];
  criticalFiles: FileClassification[];
  doNotModifyZones: FileClassification[];
}

export interface FileClassification {
  path: string;
  zone: SafetyZone;
  reason: string;
  blastRadius: number;
  requiredTests: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  rollbackStrategy?: string;
}

// ─── AI Edit Rules ──────────────────────────────────────────

export interface AIEditRules {
  always: string[];
  never: string[];
  beforeEdit: string[];
  afterEdit: string[];
}

// ─── Risk Intelligence ──────────────────────────────────────

export interface RiskIntelligence {
  blastRadiusMap: BlastRadiusEntry[];
  criticalFiles: string[];
  unsafeEdits: UnsafeEditEntry[];
  singlePointsOfFailure: string[];
  untestedPaths: string[];
  overallRiskScore: number;
}

export interface BlastRadiusEntry {
  file: string;
  dependentCount: number;
  affectedModules: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface UnsafeEditEntry {
  file: string;
  reason: string;
  complexity: number;
  testCoverage: number;
  recommendation: string;
}

// ─── Change Impact ──────────────────────────────────────────

export interface ChangeImpactAnalysis {
  changedFile: string;
  affectedModules: string[];
  affectedTests: string[];
  affectedRuntimePaths: string[];
  dependencyCascade: string[];
  blastRadius: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendation: string;
}

// ─── Validation Intelligence ────────────────────────────────

export interface ValidationIntelligence {
  confidenceScore: number;
  staleStatus: StaleStatusEntry[];
  verificationReport: VerificationEntry[];
  timestamp: string;
  generationDuration: number;
  artifactCount: number;
  warnings: string[];
}

export interface StaleStatusEntry {
  artifact: string;
  stale: boolean;
  lastUpdated: string;
  reason?: string;
}

export interface VerificationEntry {
  check: string;
  passed: boolean;
  message: string;
  severity: 'info' | 'warning' | 'error';
}

// ─── Feature Verification ───────────────────────────────────

export interface FeatureVerification {
  featureName: string;
  exists: boolean;
  implemented: boolean;
  tested: boolean;
  documented: boolean;
  confidence: number;
  evidence: string[];
}

// ─── Project Memory ─────────────────────────────────────────

export interface ProjectMemoryState {
  historicalDecisions: MemoryDecision[];
  rejectedIdeas: MemoryEntry[];
  activeWork: MemoryEntry[];
  plannedWork: MemoryEntry[];
  lastEdits: MemoryEdit[];
  knownFailures: MemoryEntry[];
  lessonsLearned: MemoryEntry[];
  roadmap: MemoryEntry[];
  evolutionHistory: EvolutionEntry[];
}

export interface MemoryDecision {
  title: string;
  context: string;
  decision: string;
  rationale: string;
  date: string;
  status: 'active' | 'superseded' | 'deprecated';
}

export interface MemoryEntry {
  title: string;
  description: string;
  date: string;
  tags: string[];
  relatedFiles: string[];
}

export interface MemoryEdit {
  file: string;
  action: 'created' | 'modified' | 'deleted';
  date: string;
  summary: string;
}

export interface EvolutionEntry {
  date: string;
  type: 'architecture' | 'feature' | 'refactor' | 'migration' | 'dependency';
  description: string;
  impact: string;
}

// ─── AI Navigation Map ─────────────────────────────────────

export interface AINavigationMap {
  needArchitecture: string;
  needRuntime: string;
  needModification: string;
  needDebugging: string;
  needOnboarding: string;
  needValidation: string;
  needSecurity: string;
  needPerformance: string;
  needFeatures: string;
  needDependencies: string;
  needTests: string;
  needRisks: string;
}

// ─── Unified Project Intelligence ───────────────────────────

export interface ProjectIntelligence {
  projectIdentity: ProjectIdentity;
  domainModel: DomainModel;
  architecture: ArchitectureIntelligence;
  executionFlows: ExecutionFlows;
  featureMatrix: FeatureMatrix;
  apiIntelligence: APIIntelligence;
  dataIntelligence: DataIntelligence;
  configIntelligence: ConfigIntelligence;
  securityIntelligence: SecurityIntelligence;
  performanceIntelligence: PerformanceIntelligence;
  observabilityIntelligence: ObservabilityIntelligence;
  technicalDebt: TechnicalDebtInventory;
  safetyClassification: SafetyClassification;
  aiEditRules: AIEditRules;
  riskIntelligence: RiskIntelligence;
  validationIntelligence: ValidationIntelligence;
  memoryState: ProjectMemoryState;
  navigationMap: AINavigationMap;
  generatedAt: string;
  pgosVersion: string;
}
