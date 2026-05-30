// ============================================================
// @pgos/api — Documentation OS Routes
// ============================================================

import type { FastifyPluginAsync } from 'fastify';
import { DocOrchestrator, DocValidator, RequirementEngine } from '@pgos/doc-engine';

export const registerDocRoutes: FastifyPluginAsync = async (server) => {
  // Trigger full documentation auto-generation
  server.post('/:id/docs/compile', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { rootPath: string };

    if (!body.rootPath) {
      return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: 'rootPath is required' } });
    }

    try {
      await DocOrchestrator.handleCodeChange(body.rootPath);
      
      // Notify WebSocket subscribers about the documentation regeneration
      if (server.io) {
        server.io.to(`project:${id}`).emit('project:docs:updated', {
          projectId: id,
          status: 'synchronized',
          timestamp: new Date().toISOString(),
        });
      }

      return {
        data: {
          projectId: id,
          status: 'synchronized',
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      return reply.status(500).send({ error: { code: 'DOCS_ERROR', message: msg } });
    }
  });

  // Get documentation and requirement coverage scorecard
  server.get('/:id/docs/coverage', async (request, reply) => {
    const { id } = request.params as { id: string };
    
    const mockDocsList = [
      'docs/requirements/PRD.md',
      'docs/technical/LLD.md',
      'docs/guides/onboarding.md',
    ];

    const report = DocValidator.validateDocumentation(mockDocsList);
    const reqCoverage = RequirementEngine.getRequirementCoverageScore();

    return {
      data: {
        projectId: id,
        docCoverage: report.overallScore,
        requirementCoverage: reqCoverage,
        staleDocs: report.staleDocs,
        placeholderCount: report.placeholderCount,
        suggestions: report.suggestions,
      },
    };
  });
};
