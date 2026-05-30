// ============================================================
// @pgos/api — Context Routes
// ============================================================

import type { FastifyPluginAsync } from 'fastify';
import { compileContext, packageContext } from '@pgos/context-engine';

export const registerContextRoutes: FastifyPluginAsync = async (server) => {
  // Get compiled context for a project
  server.get('/:id/context', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { level, format } = request.query as { level?: string; format?: string };

    return {
      data: {
        projectId: id,
        message: 'Context endpoint ready. Use POST /:id/context/compile to generate context.',
        level: level || 'all',
        format: format || 'json',
      },
    };
  });

  // Compile context
  server.post('/:id/context/compile', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { rootPath: string; levels?: string[] };

    if (!body.rootPath) {
      return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: 'rootPath is required' } });
    }

    try {
      const levels = (body.levels || ['L0', 'L1', 'L2']) as ('L0' | 'L1' | 'L2' | 'L3' | 'L4')[];
      const result = await compileContext(id, body.rootPath, { levels });

      // Convert Map to serializable format
      const packages: Record<string, unknown> = {};
      for (const [level, pkg] of result.packages) {
        packages[level] = {
          id: pkg.id,
          level: pkg.level,
          tokenCount: pkg.tokenCount,
          compressedTokens: pkg.compressedTokens,
          hash: pkg.hash,
        };
      }

      return {
        data: {
          projectId: id,
          packages,
          totalTokens: result.totalTokens,
          optimizedTokens: result.optimizedTokens,
          reductionPercent: result.reductionPercent,
          filesProcessed: result.filesProcessed,
          duration: result.duration,
        },
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      return reply.status(500).send({ error: { code: 'CONTEXT_ERROR', message: msg } });
    }
  });

  // Export context for a specific model
  server.post('/:id/context/export', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as {
      rootPath: string;
      targetModel: string;
      format?: string;
      maxTokens?: number;
    };

    if (!body.rootPath || !body.targetModel) {
      return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: 'rootPath and targetModel are required' } });
    }

    try {
      const result = await compileContext(id, body.rootPath, { levels: ['L0', 'L1', 'L2'] });
      const packaged = packageContext(result.packages, {
        targetModel: body.targetModel,
        format: (body.format as 'yaml' | 'json' | 'markdown' | 'xml') || 'yaml',
        maxTokens: body.maxTokens || 40000,
      });

      return {
        data: {
          projectId: id,
          content: packaged.content,
          format: packaged.format,
          tokens: packaged.tokens,
          levels: packaged.levels,
          modelTarget: packaged.modelTarget,
        },
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      return reply.status(500).send({ error: { code: 'EXPORT_ERROR', message: msg } });
    }
  });
};
