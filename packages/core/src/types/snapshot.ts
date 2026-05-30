// ============================================================
// @pgos/core — Snapshot Types
// Type definitions for Snapshot & Recovery Engine
// ============================================================

export interface Snapshot {
  id: string;
  projectId: string;
  name?: string;
  label?: SnapshotLabel;
  trigger: SnapshotTrigger;
  contents: SnapshotContents;
  storagePath: string;
  sizeBytes: number;
  metadata: SnapshotMetadata;
  createdAt: Date;
}

export type SnapshotLabel = 'stable' | 'pre-ai' | 'checkpoint' | 'pre-deploy' | 'release' | 'custom';

export type SnapshotTrigger = 'manual' | 'pre-action' | 'scheduled' | 'pre-model-switch' | 'auto';

export interface SnapshotContents {
  /** Files included (relative paths) */
  files: SnapshotFile[];
  /** Context package at time of snapshot */
  contextHash: string;
  /** Test results at time of snapshot */
  testResults?: TestSnapshot;
  /** Dependency manifest */
  dependencies: DependencySnapshot;
  /** Architecture fingerprint */
  architectureHash: string;
  /** Memory state */
  memoryHash?: string;
  /** Health metrics at time */
  health: HealthSnapshot;
}

export interface SnapshotFile {
  path: string;
  hash: string;
  size: number;
  modified: Date;
}

export interface TestSnapshot {
  totalTests: number;
  passing: number;
  failing: number;
  skipped: number;
  coverage: number;
}

export interface DependencySnapshot {
  lockfileHash: string;
  packages: { name: string; version: string }[];
  count: number;
}

export interface HealthSnapshot {
  completionScore: number;
  architectureScore: number;
  testCoverage: number;
  hallucinationRisk: number;
}

export interface SnapshotMetadata {
  description?: string;
  modelUsed?: string;
  sessionId?: string;
  tags?: string[];
  parentSnapshotId?: string;
}

export interface SnapshotDiff {
  snapshotA: string;
  snapshotB: string;
  filesAdded: string[];
  filesRemoved: string[];
  filesModified: string[];
  dependenciesChanged: boolean;
  architectureChanged: boolean;
  healthDelta: Partial<HealthSnapshot>;
}

export interface RecoveryOptions {
  snapshotId: string;
  scope: RecoveryScope;
  targets?: string[];
  dryRun?: boolean;
  preserveNewFiles?: boolean;
}

export type RecoveryScope = 'full' | 'feature' | 'module' | 'architecture' | 'file';

export interface RecoveryResult {
  success: boolean;
  scope: RecoveryScope;
  filesRestored: number;
  filesSkipped: number;
  conflicts: RecoveryConflict[];
  duration: number;
  newSnapshotId?: string;
}

export interface RecoveryConflict {
  file: string;
  type: 'modified-locally' | 'deleted-remotely' | 'new-conflict';
  resolution?: 'snapshot' | 'current' | 'merged';
}
