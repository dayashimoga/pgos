// ============================================================
// @pgos/api — Project Routes
// CRUD operations for projects and ingestion
// ============================================================

import type { FastifyPluginAsync } from 'fastify';
import { generateId, slugify } from '@pgos/core';
import { compileContext } from '@pgos/context-engine';

// In-memory store for MVP (replace with PostgreSQL in production)
const projects = new Map<string, Record<string, unknown>>();

export const registerProjectRoutes: FastifyPluginAsync = async (server) => {
  // List all projects
  server.get('/', async (request, reply) => {
    const projectList = Array.from(projects.values());
    return {
      data: projectList,
      total: projectList.length,
    };
  });

  // Create a new project
  server.post('/', async (request, reply) => {
    const body = request.body as { name: string; rootPath: string; description?: string; repoUrl?: string };

    if (!body.name || !body.rootPath) {
      return reply.status(400).send({ error: { code: 'VALIDATION_ERROR', message: 'name and rootPath are required' } });
    }

    const project = {
      id: generateId(),
      name: body.name,
      slug: slugify(body.name),
      description: body.description || '',
      repoUrl: body.repoUrl || '',
      rootPath: body.rootPath,
      config: {},
      healthScore: 0,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    projects.set(project.id, project);

    return reply.status(201).send({ data: project });
  });

  // Get project by ID
  server.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const project = projects.get(id);

    if (!project) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Project not found' } });
    }

    return { data: project };
  });

  // Update project
  server.put('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const project = projects.get(id);

    if (!project) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Project not found' } });
    }

    const updates = request.body as Record<string, unknown>;
    const updated = { ...project, ...updates, updatedAt: new Date().toISOString() };
    projects.set(id, updated);

    return { data: updated };
  });

  // Delete project
  server.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const deleted = projects.delete(id);

    if (!deleted) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Project not found' } });
    }

    return { success: true };
  });

  // Ingest project (trigger full analysis)
  server.post('/:id/ingest', async (request, reply) => {
    const { id } = request.params as { id: string };
    const project = projects.get(id);

    if (!project) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Project not found' } });
    }

    try {
      const rootPath = project.rootPath as string;
      const result = await compileContext(id, rootPath, { levels: ['L0', 'L1', 'L2'] });

      // Update project health
      project.healthScore = 75; // Baseline after ingestion
      project.status = 'active';
      project.updatedAt = new Date().toISOString();
      projects.set(id, project);

      return {
        data: {
          projectId: id,
          filesProcessed: result.filesProcessed,
          totalTokens: result.totalTokens,
          optimizedTokens: result.optimizedTokens,
          reductionPercent: result.reductionPercent,
          duration: result.duration,
        },
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      return reply.status(500).send({ error: { code: 'INGESTION_ERROR', message: msg } });
    }
  });

  // Get project health
  server.get('/:id/health', async (request, reply) => {
    const { id } = request.params as { id: string };
    const project = projects.get(id);

    if (!project) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Project not found' } });
    }

    return {
      data: {
        projectId: id,
        overall: project.healthScore || 0,
        completionScore: 0,
        architectureScore: 0,
        testCoverage: 0,
        hallucinationRisk: 0,
        securityScore: 0,
        tokenEfficiency: 0,
        issues: [],
      },
    };
  });
};
