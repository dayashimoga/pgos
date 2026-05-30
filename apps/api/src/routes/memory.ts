// ============================================================
// @pgos/api — Semantic Memory Routes
// ============================================================

import type { FastifyPluginAsync } from 'fastify';
import { type MemoryType } from '@pgos/core';
import { memoryStore } from '@pgos/memory-engine';

export const registerMemoryRoutes: FastifyPluginAsync = async (server) => {
  // Store a decision or lesson memory
  server.post('/:id/memory', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { type: MemoryType; content: string; metadata?: any };

    if (!body.type || !body.content) {
      return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: 'type and content are required' } });
    }

    try {
      const memory = await memoryStore.store(id, body.type, body.content, body.metadata || {});
      return { data: memory };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      return reply.status(500).send({ error: { code: 'MEMORY_ERROR', message: msg } });
    }
  });

  // Query/Search memories semantically
  server.get('/:id/memory', async (request, reply) => {
    const { id } = request.params as { id: string };
    const query = request.query as { q?: string; type?: MemoryType };

    try {
      const results = await memoryStore.search({
        projectId: id,
        query: query.q || '',
        types: query.type ? [query.type] : undefined,
      });
      return { data: results };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      return reply.status(500).send({ error: { code: 'MEMORY_ERROR', message: msg } });
    }
  });
};
