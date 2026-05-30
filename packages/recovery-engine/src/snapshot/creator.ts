// ============================================================
// @pgos/recovery-engine — Snapshot Creator
// Create full project snapshots for recovery
// ============================================================

import { readFile, writeFile, mkdir, stat } from 'fs/promises';
import { join, relative } from 'path';
import {
  type Snapshot,
  type SnapshotContents,
  type SnapshotFile,
  type SnapshotTrigger,
  type SnapshotLabel,
  type SnapshotMetadata,
  type HealthSnapshot,
  generateId,
  sha256,
  listFilesRecursive,
  isBinaryFile,
  ensureDir,
  componentLogger,
  GUARDIAN_DIRS,
} from '@pgos/core';

const log = componentLogger('snapshot-creator');

export interface SnapshotOptions {
  projectId: string;
  rootPath: string;
  trigger: SnapshotTrigger;
  label?: SnapshotLabel;
  name?: string;
  metadata?: Partial<SnapshotMetadata>;
  storagePath?: string;
}

/**
 * Create a full project snapshot
 */
export async function createSnapshot(options: SnapshotOptions): Promise<Snapshot> {
  const startTime = Date.now();
  const snapshotId = generateId();

  log.info({ snapshotId, projectId: options.projectId, trigger: options.trigger }, 'Creating snapshot');

  // Determine storage path
  const storagePath = options.storagePath || join(options.rootPath, GUARDIAN_DIRS.snapshots, snapshotId);
  await ensureDir(storagePath);

  // Collect all project files
  const files = await listFilesRecursive(options.rootPath);
  const sourceFiles = files.filter((f) => !isBinaryFile(f) && !f.includes('.guardian/snapshots'));

  // Create file manifests and copy content
  const snapshotFiles: SnapshotFile[] = [];
  let totalSize = 0;

  const fileContentsDir = join(storagePath, 'files');
  await ensureDir(fileContentsDir);

  for (const filePath of sourceFiles) {
    try {
      const content = await readFile(filePath, 'utf-8');
      const relativePath = relative(options.rootPath, filePath).replace(/\\/g, '/');
      const fileHash = sha256(content);
      const fileStats = await stat(filePath);

      snapshotFiles.push({
        path: relativePath,
        hash: fileHash,
        size: fileStats.size,
        modified: fileStats.mtime,
      });

      // Store file content
      const destPath = join(fileContentsDir, relativePath);
      await ensureDir(join(destPath, '..'));
      await writeFile(destPath, content, 'utf-8');

      totalSize += fileStats.size;
    } catch (error) {
      log.warn({ filePath, error }, 'Failed to snapshot file');
    }
  }

  // Build snapshot contents
  const contents: SnapshotContents = {
    files: snapshotFiles,
    contextHash: '',
    dependencies: {
      lockfileHash: '',
      packages: [],
      count: 0,
    },
    architectureHash: '',
    health: {
      completionScore: 0,
      architectureScore: 0,
      testCoverage: 0,
      hallucinationRisk: 0,
    },
  };

  // Save snapshot manifest
  const snapshot: Snapshot = {
    id: snapshotId,
    projectId: options.projectId,
    name: options.name || `Snapshot ${new Date().toISOString()}`,
    label: options.label,
    trigger: options.trigger,
    contents,
    storagePath,
    sizeBytes: totalSize,
    metadata: {
      description: options.metadata?.description,
      modelUsed: options.metadata?.modelUsed,
      sessionId: options.metadata?.sessionId,
      tags: options.metadata?.tags || [],
    },
    createdAt: new Date(),
  };

  // Write manifest
  await writeFile(
    join(storagePath, 'manifest.json'),
    JSON.stringify(snapshot, null, 2),
    'utf-8'
  );

  const duration = Date.now() - startTime;
  log.info({
    snapshotId,
    files: snapshotFiles.length,
    sizeBytes: totalSize,
    duration: `${duration}ms`,
  }, 'Snapshot created');

  return snapshot;
}

/**
 * List all snapshots for a project
 */
export async function listSnapshots(rootPath: string): Promise<Snapshot[]> {
  const snapshotsDir = join(rootPath, GUARDIAN_DIRS.snapshots);
  const snapshots: Snapshot[] = [];

  try {
    const { readdir } = await import('fs/promises');
    const entries = await readdir(snapshotsDir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      try {
        const manifestPath = join(snapshotsDir, entry.name, 'manifest.json');
        const content = await readFile(manifestPath, 'utf-8');
        const snapshot = JSON.parse(content) as Snapshot;
        snapshots.push(snapshot);
      } catch {
        // Skip invalid snapshots
      }
    }
  } catch {
    // No snapshots directory yet
  }

  return snapshots.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Get a specific snapshot by ID
 */
export async function getSnapshot(rootPath: string, snapshotId: string): Promise<Snapshot | null> {
  const manifestPath = join(rootPath, GUARDIAN_DIRS.snapshots, snapshotId, 'manifest.json');

  try {
    const content = await readFile(manifestPath, 'utf-8');
    return JSON.parse(content) as Snapshot;
  } catch {
    return null;
  }
}
