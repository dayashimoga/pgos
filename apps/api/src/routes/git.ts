// ============================================================
// @pgos/api — Semantic Git Routes
// ============================================================

import type { FastifyPluginAsync } from 'fastify';
import { semanticCommit } from '@pgos/semantic-git';

export const registerGitRoutes: FastifyPluginAsync = async (server) => {
  // Perform semantic commit analysis
  server.post('/:id/git/commit', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { message: string; rootPath: string; files?: string[] };

    if (!body.message || !body.rootPath) {
      return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: 'message and rootPath are required' } });
    }

    try {
      const analysis = await semanticCommit(body.rootPath, body.message, { projectId: id, files: body.files });
      const { projectId, ...rest } = analysis;
      return {
        data: {
          projectId: id,
          gitSha: Math.random().toString(16).substring(2, 10), // mock SHA for MVP
          ...rest,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      return reply.status(500).send({ error: { code: 'GIT_ERROR', message: msg } });
    }
  });

  // Get semantic diff
  server.get('/:id/git/diff', async (request, reply) => {
    const { id } = request.params as { id: string };
    return {
      data: {
        projectId: id,
        diffs: [
          {
            file: 'packages/core/src/types/validation.ts',
            action: 'modify',
            changes: 'Aligned AntiPatternType literals to prevent compiler errors.',
            riskScore: 10,
          },
        ],
      },
    };
  });

  // Get semantic commit history
  server.get('/:id/git/history', async (request, reply) => {
    const { id } = request.params as { id: string };
    return {
      data: {
        projectId: id,
        history: [
          {
            gitSha: 'a4fd83e',
            type: 'refactor',
            message: 'refactor: aligned anti-pattern type definitions',
            riskScore: 15,
            timestamp: new Date().toISOString(),
          },
        ],
      },
    };
  });
};
