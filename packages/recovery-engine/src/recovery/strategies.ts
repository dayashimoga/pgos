// ============================================================
// @pgos/recovery-engine — Recovery Strategies
// Restore project state from snapshots
// ============================================================

import { readFile, writeFile, rm, readdir, stat } from 'fs/promises';
import { join, relative, dirname } from 'path';
import {
  type Snapshot,
  type RecoveryOptions,
  type RecoveryResult,
  type RecoveryConflict,
  type RecoveryScope,
  ensureDir,
  fileExists,
  sha256,
  componentLogger,
  SnapshotNotFoundError,
  RecoveryError,
  GUARDIAN_DIRS,
} from '@pgos/core';
import { createSnapshot } from '../snapshot/creator.js';
import { getSnapshot } from '../snapshot/creator.js';

const log = componentLogger('recovery');

/**
 * Restore project files from a snapshot
 */
export async function restoreFromSnapshot(
  rootPath: string,
  options: RecoveryOptions
): Promise<RecoveryResult> {
  const startTime = Date.now();
  log.info({ snapshotId: options.snapshotId, scope: options.scope }, 'Starting recovery');

  // Load snapshot manifest
  const snapshot = await getSnapshot(rootPath, options.snapshotId);
  if (!snapshot) {
    throw new SnapshotNotFoundError(options.snapshotId);
  }

  // Create a safety snapshot before recovery
  let safetySnapshotId: string | undefined;
  if (!options.dryRun) {
    try {
      const safety = await createSnapshot({
        projectId: snapshot.projectId,
        rootPath,
        trigger: 'pre-action',
        label: 'pre-ai',
        name: `Pre-recovery safety snapshot`,
        metadata: { description: `Created before restoring snapshot ${options.snapshotId}` },
      });
      safetySnapshotId = safety.id;
    } catch (error) {
      log.warn({ error }, 'Failed to create safety snapshot');
    }
  }

  const result: RecoveryResult = {
    success: false,
    scope: options.scope,
    filesRestored: 0,
    filesSkipped: 0,
    conflicts: [],
    duration: 0,
    newSnapshotId: safetySnapshotId,
  };

  try {
    switch (options.scope) {
      case 'full':
        await restoreFull(rootPath, snapshot, options, result);
        break;
      case 'feature':
      case 'module':
        await restorePartial(rootPath, snapshot, options, result);
        break;
      case 'file':
        await restoreFiles(rootPath, snapshot, options, result);
        break;
      case 'architecture':
        await restoreArchitecture(rootPath, snapshot, options, result);
        break;
    }

    result.success = true;
  } catch (error) {
    log.error({ error }, 'Recovery failed');
    throw new RecoveryError(error instanceof Error ? error.message : String(error));
  }

  result.duration = Date.now() - startTime;
  log.info({
    success: result.success,
    filesRestored: result.filesRestored,
    conflicts: result.conflicts.length,
    duration: `${result.duration}ms`,
  }, 'Recovery complete');

  return result;
}

/**
 * Full project restore from snapshot
 */
async function restoreFull(
  rootPath: string,
  snapshot: Snapshot,
  options: RecoveryOptions,
  result: RecoveryResult
): Promise<void> {
  const filesDir = join(snapshot.storagePath, 'files');

  for (const file of snapshot.contents.files) {
    const sourcePath = join(filesDir, file.path);
    const destPath = join(rootPath, file.path);

    if (options.dryRun) {
      result.filesRestored++;
      continue;
    }

    try {
      // Check for conflicts
      if (await fileExists(destPath)) {
        const currentContent = await readFile(destPath, 'utf-8');
        const currentHash = sha256(currentContent);

        if (currentHash !== file.hash) {
          if (!options.preserveNewFiles) {
            await ensureDir(dirname(destPath));
            const snapshotContent = await readFile(sourcePath, 'utf-8');
            await writeFile(destPath, snapshotContent, 'utf-8');
            result.filesRestored++;
          } else {
            result.conflicts.push({
              file: file.path,
              type: 'modified-locally',
            });
            result.filesSkipped++;
          }
        } else {
          result.filesSkipped++; // File unchanged
        }
      } else {
        // File doesn't exist — restore it
        await ensureDir(dirname(destPath));
        const snapshotContent = await readFile(sourcePath, 'utf-8');
        await writeFile(destPath, snapshotContent, 'utf-8');
        result.filesRestored++;
      }
    } catch (error) {
      log.warn({ file: file.path, error }, 'Failed to restore file');
      result.filesSkipped++;
    }
  }
}

/**
 * Partial restore (feature/module scope)
 */
async function restorePartial(
  rootPath: string,
  snapshot: Snapshot,
  options: RecoveryOptions,
  result: RecoveryResult
): Promise<void> {
  const targets = options.targets || [];
  if (targets.length === 0) {
    throw new RecoveryError('No targets specified for partial recovery');
  }

  const filesDir = join(snapshot.storagePath, 'files');

  // Filter files matching targets
  const matchingFiles = snapshot.contents.files.filter((f) =>
    targets.some((target) => f.path.includes(target))
  );

  for (const file of matchingFiles) {
    const sourcePath = join(filesDir, file.path);
    const destPath = join(rootPath, file.path);

    if (options.dryRun) {
      result.filesRestored++;
      continue;
    }

    try {
      await ensureDir(dirname(destPath));
      const content = await readFile(sourcePath, 'utf-8');
      await writeFile(destPath, content, 'utf-8');
      result.filesRestored++;
    } catch (error) {
      log.warn({ file: file.path, error }, 'Failed to restore file');
      result.filesSkipped++;
    }
  }
}

/**
 * Restore specific files
 */
async function restoreFiles(
  rootPath: string,
  snapshot: Snapshot,
  options: RecoveryOptions,
  result: RecoveryResult
): Promise<void> {
  await restorePartial(rootPath, snapshot, options, result);
}

/**
 * Restore architecture-critical files
 */
async function restoreArchitecture(
  rootPath: string,
  snapshot: Snapshot,
  options: RecoveryOptions,
  result: RecoveryResult
): Promise<void> {
  // Restore config files, package manifests, and architecture-critical files
  const archPatterns = [
    'package.json',
    'tsconfig',
    'webpack',
    'vite.config',
    'next.config',
    'docker',
    'Dockerfile',
    '.env',
    'config/',
    'src/index',
    'src/main',
    'src/app',
  ];

  const matchingFiles = snapshot.contents.files.filter((f) =>
    archPatterns.some((pattern) => f.path.includes(pattern))
  );

  const filesDir = join(snapshot.storagePath, 'files');

  for (const file of matchingFiles) {
    const sourcePath = join(filesDir, file.path);
    const destPath = join(rootPath, file.path);

    if (options.dryRun) {
      result.filesRestored++;
      continue;
    }

    try {
      await ensureDir(dirname(destPath));
      const content = await readFile(sourcePath, 'utf-8');
      await writeFile(destPath, content, 'utf-8');
      result.filesRestored++;
    } catch (error) {
      log.warn({ file: file.path, error }, 'Failed to restore file');
      result.filesSkipped++;
    }
  }
}

/**
 * Get available recovery options for a project
 */
export async function getRecoveryOptions(rootPath: string): Promise<{
  snapshots: Snapshot[];
  scopes: RecoveryScope[];
}> {
  const { listSnapshots } = await import('../snapshot/creator.js');
  const snapshots = await listSnapshots(rootPath);

  return {
    snapshots,
    scopes: ['full', 'feature', 'module', 'architecture', 'file'],
  };
}
