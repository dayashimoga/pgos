// ============================================================
// @pgos/api — Agent Orchestration Routes
// ============================================================

import type { FastifyPluginAsync } from 'fastify';
import { Orchestrator } from '@pgos/agent-runtime';

const orchestrator = new Orchestrator();

export const registerAgentRoutes: FastifyPluginAsync = async (server) => {
  // Execute a multi-agent goal loop
  server.post('/:id/agents/run', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { goal: string; context: string };

    if (!body.goal || !body.context) {
      return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: 'goal and context are required' } });
    }

    try {
      const taskResults = await orchestrator.executeGoal(id, body.goal, body.context);
      
      // Notify WebSocket subscribers about the new agent task progress
      if (server.io) {
        server.io.to(`project:${id}`).emit('agent:task:completed', {
          projectId: id,
          goal: body.goal,
          tasksCount: taskResults.length,
          timestamp: new Date().toISOString(),
        });
      }

      return {
        data: {
          projectId: id,
          goal: body.goal,
          tasks: taskResults,
        },
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      return reply.status(500).send({ error: { code: 'AGENT_ERROR', message: msg } });
    }
  });

  // Get active agent tasks
  server.get('/:id/agents/tasks', async (request, reply) => {
    const { id } = request.params as { id: string };
    return {
      data: {
        projectId: id,
        tasks: [
          {
            id: 'task_001',
            agentType: 'coder',
            description: 'Implement type alignments inside packages/core/src/types/validation.ts',
            status: 'completed',
            assignedModel: 'gemini-1-5-pro',
            tokensUsed: 4200,
          },
        ],
      },
    };
  });
};
