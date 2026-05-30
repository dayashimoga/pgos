// ============================================================
// @pgos/api — Recovery Routes
// ============================================================

import type { FastifyPluginAsync } from 'fastify';
import { restoreFromSnapshot, getRecoveryOptions } from '@pgos/recovery-engine';

export const registerRecoveryRoutes: FastifyPluginAsync = async (server) => {
  // Rollback to snapshot
  server.post('/:id/recovery/rollback', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as {
      rootPath: string;
      snapshotId: string;
      scope?: string;
      targets?: string[];
      dryRun?: boolean;
    };

    if (!body.rootPath || !body.snapshotId) {
      return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: 'rootPath and snapshotId are required' } });
    }

    try {
      const result = await restoreFromSnapshot(body.rootPath, {
        snapshotId: body.snapshotId,
        scope: (body.scope as 'full' | 'feature' | 'module' | 'architecture' | 'file') || 'full',
        targets: body.targets,
        dryRun: body.dryRun,
      });

      return { data: { projectId: id, ...result } };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      return reply.status(500).send({ error: { code: 'RECOVERY_ERROR', message: msg } });
    }
  });

  // Get recovery options
  server.get('/:id/recovery/options', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { rootPath } = request.query as { rootPath: string };

    if (!rootPath) {
      return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: 'rootPath query param required' } });
    }

    const options = await getRecoveryOptions(rootPath);
    return { data: { projectId: id, ...options } };
  });
};
