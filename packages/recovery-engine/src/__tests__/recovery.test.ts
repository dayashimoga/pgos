import { describe, it, expect, afterAll } from 'vitest';
import { createSnapshot, listSnapshots, getSnapshot } from '../snapshot/creator.js';
import { restoreFromSnapshot } from '../recovery/strategies.js';
import { join, dirname } from 'path';
import { mkdir, writeFile, readFile, rm } from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('PGOS Recovery Engine', () => {
  const mockRoot = join(__dirname, 'mock-project-recovery');

  afterAll(async () => {
    await rm(mockRoot, { recursive: true, force: true });
  });

  describe('createSnapshot', () => {
    it('should create a full project snapshot with manifest', async () => {
      await mkdir(join(mockRoot, 'src'), { recursive: true });
      await writeFile(join(mockRoot, 'src', 'app.ts'), 'export const app = "hello";');
      await writeFile(join(mockRoot, 'package.json'), '{"name":"test"}');

      const snapshot = await createSnapshot({
        projectId: 'test-project',
        rootPath: mockRoot,
        trigger: 'manual',
        label: 'stable',
        name: 'Test Snapshot',
      });

      expect(snapshot.id).toBeDefined();
      expect(snapshot.id.length).toBeGreaterThan(0);
      expect(snapshot.projectId).toBe('test-project');
      expect(snapshot.name).toBe('Test Snapshot');
      expect(snapshot.label).toBe('stable');
      expect(snapshot.trigger).toBe('manual');
      expect(snapshot.contents.files.length).toBeGreaterThan(0);
      expect(snapshot.sizeBytes).toBeGreaterThan(0);
      expect(snapshot.storagePath).toBeDefined();
    });

    it('should store file hashes in manifest', async () => {
      const snapshot = await createSnapshot({
        projectId: 'test-project',
        rootPath: mockRoot,
        trigger: 'manual',
      });

      for (const file of snapshot.contents.files) {
        expect(file.hash).toBeDefined();
        expect(file.hash.length).toBeGreaterThan(0);
        expect(file.path).toBeDefined();
        expect(file.size).toBeGreaterThan(0);
      }
    });
  });

  describe('listSnapshots', () => {
    it('should list created snapshots', async () => {
      const snapshots = await listSnapshots(mockRoot);
      expect(snapshots.length).toBeGreaterThan(0);
      expect(snapshots[0].id).toBeDefined();
    });

    it('should sort snapshots by date (newest first)', async () => {
      const snapshots = await listSnapshots(mockRoot);
      if (snapshots.length > 1) {
        const first = new Date(snapshots[0].createdAt).getTime();
        const second = new Date(snapshots[1].createdAt).getTime();
        expect(first).toBeGreaterThanOrEqual(second);
      }
    });
  });

  describe('getSnapshot', () => {
    it('should retrieve a specific snapshot by ID', async () => {
      const created = await createSnapshot({
        projectId: 'test-project',
        rootPath: mockRoot,
        trigger: 'manual',
        name: 'Retrievable',
      });

      const retrieved = await getSnapshot(mockRoot, created.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved!.id).toBe(created.id);
      expect(retrieved!.name).toBe('Retrievable');
    });

    it('should return null for non-existent snapshot', async () => {
      const result = await getSnapshot(mockRoot, 'non-existent-id-12345');
      expect(result).toBeNull();
    });
  });

  describe('restoreFromSnapshot', () => {
    it('should restore files from snapshot', async () => {
      // Create initial state
      await writeFile(join(mockRoot, 'src', 'app.ts'), 'export const version = "v1";');

      // Create snapshot
      const snapshot = await createSnapshot({
        projectId: 'test-project',
        rootPath: mockRoot,
        trigger: 'manual',
        label: 'stable',
      });

      // Modify file (simulate bad edit)
      await writeFile(join(mockRoot, 'src', 'app.ts'), 'export const version = "BROKEN";');

      // Restore from snapshot
      const result = await restoreFromSnapshot(mockRoot, {
        snapshotId: snapshot.id,
        scope: 'full',
      });

      expect(result.success).toBe(true);
      expect(result.filesRestored).toBeGreaterThan(0);

      // Verify file is restored
      const content = await readFile(join(mockRoot, 'src', 'app.ts'), 'utf-8');
      expect(content).toBe('export const version = "v1";');
    });

    it('should create a safety snapshot before recovery', async () => {
      const snapshot = await createSnapshot({
        projectId: 'test-project',
        rootPath: mockRoot,
        trigger: 'manual',
      });

      const result = await restoreFromSnapshot(mockRoot, {
        snapshotId: snapshot.id,
        scope: 'full',
      });

      expect(result.newSnapshotId).toBeDefined();
    });

    it('should support dry-run mode', async () => {
      const snapshot = await createSnapshot({
        projectId: 'test-project',
        rootPath: mockRoot,
        trigger: 'manual',
      });

      const result = await restoreFromSnapshot(mockRoot, {
        snapshotId: snapshot.id,
        scope: 'full',
        dryRun: true,
      });

      expect(result.success).toBe(true);
      expect(result.filesRestored).toBeGreaterThan(0);
    });

    it('should throw for non-existent snapshot', async () => {
      await expect(
        restoreFromSnapshot(mockRoot, {
          snapshotId: 'does-not-exist',
          scope: 'full',
        })
      ).rejects.toThrow();
    });
  });
});
