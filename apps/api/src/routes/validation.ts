// ============================================================
// @pgos/api — Validation Routes
// ============================================================

import type { FastifyPluginAsync } from 'fastify';
import { checkCompletion, detectAntiPatterns } from '@pgos/validation-engine';
import { detectHallucinations } from '@pgos/hallucination-detector';
import { validateArchitecture, inferArchitecture } from '@pgos/architecture-guard';

export const registerValidationRoutes: FastifyPluginAsync = async (server) => {
  // Run all validations
  server.post('/:id/validate', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { rootPath: string; requirements?: string[] };

    if (!body.rootPath) {
      return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: 'rootPath is required' } });
    }

    try {
      const [completion, hallucinations, architecture] = await Promise.all([
        checkCompletion(body.rootPath, body.requirements || []),
        detectHallucinations(body.rootPath),
        inferArchitecture(body.rootPath),
      ]);

      return {
        data: {
          projectId: id,
          completion: {
            score: completion.overall,
            totalRequirements: completion.totalRequirements,
            completed: completion.completedRequirements,
            partial: completion.partialRequirements,
            absent: completion.absentRequirements,
            antiPatterns: completion.antiPatterns.length,
          },
          hallucination: {
            score: hallucinations.score,
            issues: hallucinations.issues.length,
            validated: hallucinations.validated,
          },
          architecture: {
            layers: architecture.layers.length,
            rules: architecture.rules.length,
            hash: architecture.hash,
          },
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      return reply.status(500).send({ error: { code: 'VALIDATION_ERROR', message: msg } });
    }
  });

  // Check completion only
  server.post('/:id/validate/completion', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { rootPath: string; requirements: string[] };

    if (!body.rootPath || !body.requirements) {
      return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: 'rootPath and requirements are required' } });
    }

    const result = await checkCompletion(body.rootPath, body.requirements);
    return { data: { projectId: id, ...result } };
  });

  // Check hallucinations
  server.post('/:id/validate/hallucination', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { rootPath: string };

    if (!body.rootPath) {
      return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: 'rootPath is required' } });
    }

    const result = await detectHallucinations(body.rootPath);
    return { data: { projectId: id, ...result } };
  });

  // Check architecture
  server.post('/:id/validate/architecture', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { rootPath: string };

    if (!body.rootPath) {
      return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: 'rootPath is required' } });
    }

    const result = await inferArchitecture(body.rootPath);
    const { projectId, ...rest } = result;
    return { data: { projectId: id, ...rest } };
  });
};
