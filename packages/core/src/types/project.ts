// ============================================================
// @pgos/core — Project Types
// Core type definitions for PGOS projects
// ============================================================

export interface Project {
  id: string;
  name: string;
  slug: string;
  description?: string;
  repoUrl?: string;
  repoType?: RepoType;
  rootPath: string;
  config: ProjectConfig;
  healthScore: number;
  status: ProjectStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type RepoType = 'git' | 'github' | 'gitlab' | 'bitbucket' | 'local';

export type ProjectStatus = 'active' | 'archived' | 'ingesting' | 'error';

export interface ProjectConfig {
  /** Languages used in the project */
  languages: string[];
  /** Build system (npm, yarn, pnpm, gradle, maven, cargo, etc.) */
  buildSystem?: string;
  /** Primary framework */
  framework?: string;
  /** Monorepo configuration */
  monorepo?: MonorepoConfig;
  /** Custom policies to apply */
  policies?: string[];
  /** Model preferences */
  modelPreferences?: ModelPreference[];
  /** Snapshot configuration */
  snapshotConfig?: SnapshotConfig;
  /** Ignore patterns for ingestion */
  ignorePatterns?: string[];
}

export interface MonorepoConfig {
  type: 'pnpm' | 'yarn' | 'lerna' | 'nx' | 'turborepo' | 'custom';
  packages: string[];
}

export interface ModelPreference {
  provider: string;
  model: string;
  useFor: ('architecture' | 'coding' | 'review' | 'docs' | 'testing')[];
  priority: number;
}

export interface SnapshotConfig {
  autoSnapshot: boolean;
  retentionDays: number;
  maxSnapshots: number;
  compressSnapshots: boolean;
}

export interface ProjectModule {
  name: string;
  path: string;
  language: string;
  type: ModuleType;
  dependencies: string[];
  files: number;
  loc: number;
  complexity: number;
}

export type ModuleType =
  | 'frontend'
  | 'backend'
  | 'api'
  | 'service'
  | 'library'
  | 'cli'
  | 'config'
  | 'test'
  | 'docs'
  | 'infrastructure'
  | 'middleware'
  | 'plugin'
  | 'generated'
  | 'migration'
  | 'contract'
  | 'unknown';

export interface ProjectHealth {
  overall: number;
  completionScore: number;
  architectureScore: number;
  testCoverage: number;
  hallucinationRisk: number;
  securityScore: number;
  tokenEfficiency: number;
  lastValidation?: Date;
  issues: HealthIssue[];
}

export interface HealthIssue {
  severity: 'info' | 'warning' | 'error' | 'critical';
  category: string;
  message: string;
  file?: string;
  line?: number;
  suggestion?: string;
}

export interface ProjectIngestionResult {
  projectId: string;
  modulesFound: number;
  filesProcessed: number;
  totalLoc: number;
  languages: Record<string, number>;
  dependencies: number;
  duration: number;
  warnings: string[];
}
