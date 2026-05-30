// ============================================================
// @pgos/api — Snapshot Routes
// ============================================================

import type { FastifyPluginAsync } from 'fastify';
import { createSnapshot, listSnapshots, getSnapshot } from '@pgos/recovery-engine';

export const registerSnapshotRoutes: FastifyPluginAsync = async (server) => {
  // Create snapshot
  server.post('/:id/snapshots', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { rootPath: string; name?: string; label?: string; trigger?: string };

    if (!body.rootPath) {
      return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: 'rootPath is required' } });
    }

    try {
      const snapshot = await createSnapshot({
        projectId: id,
        rootPath: body.rootPath,
        trigger: (body.trigger as 'manual' | 'pre-action' | 'scheduled') || 'manual',
        label: body.label as 'stable' | 'checkpoint' | undefined,
        name: body.name,
      });

      return reply.status(201).send({ data: snapshot });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      return reply.status(500).send({ error: { code: 'SNAPSHOT_ERROR', message: msg } });
    }
  });

  // List snapshots
  server.get('/:id/snapshots', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { rootPath } = request.query as { rootPath: string };

    if (!rootPath) {
      return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: 'rootPath query param required' } });
    }

    const snapshots = await listSnapshots(rootPath);
    return { data: snapshots.filter((s) => s.projectId === id), total: snapshots.length };
  });

  // Get snapshot details
  server.get('/:id/snapshots/:sid', async (request, reply) => {
    const { id, sid } = request.params as { id: string; sid: string };
    const { rootPath } = request.query as { rootPath: string };

    if (!rootPath) {
      return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: 'rootPath query param required' } });
    }

    const snapshot = await getSnapshot(rootPath, sid);
    if (!snapshot) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Snapshot not found' } });
    }

    return { data: snapshot };
  });
};
