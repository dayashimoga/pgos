// ============================================================
// @pgos/api — AI Session Routes
// ============================================================

import type { FastifyPluginAsync } from 'fastify';
import { generateId } from '@pgos/core';

export const registerSessionRoutes: FastifyPluginAsync = async (server) => {
  // Start an AI model session
  server.post('/:id/sessions', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { provider: string; model: string };

    if (!body.provider || !body.model) {
      return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: 'provider and model are required' } });
    }

    return {
      data: {
        sessionId: generateId(),
        projectId: id,
        provider: body.provider,
        model: body.model,
        status: 'active',
        tokensConsumed: 0,
        createdAt: new Date().toISOString(),
      },
    };
  });

  // Switch model provider while maintaining session context
  server.post('/:id/sessions/:sid/switch', async (request, reply) => {
    const { id, sid } = request.params as { id: string; sid: string };
    const body = request.body as { newProvider: string; newModel: string; contextSummary: string };

    if (!body.newProvider || !body.newModel) {
      return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: 'newProvider and newModel are required' } });
    }

    return {
      data: {
        sessionId: sid,
        projectId: id,
        previousProvider: 'openai',
        newProvider: body.newProvider,
        newModel: body.newModel,
        contextPreserved: true,
        transferredTokens: 4200,
        switchedAt: new Date().toISOString(),
      },
    };
  });
};
