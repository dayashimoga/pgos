// ============================================================
// @pgos/api — System Routes
// ============================================================

import type { FastifyPluginAsync } from 'fastify';
import { VERSION } from '@pgos/core';

export const registerSystemRoutes: FastifyPluginAsync = async (server) => {
  // System health
  server.get('/health', async () => ({
    status: 'healthy',
    version: VERSION,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      unit: 'MB',
    },
  }));

  // System metrics
  server.get('/metrics', async () => ({
    version: VERSION,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    platform: process.platform,
    nodeVersion: process.version,
    timestamp: new Date().toISOString(),
  }));

  // API info
  server.get('/info', async () => ({
    name: 'Project Guardian OS',
    version: VERSION,
    description: 'AI-native project runtime, validation, portability, recovery, context, and quality operating system',
    endpoints: {
      projects: '/api/v1/projects',
      context: '/api/v1/projects/:id/context',
      snapshots: '/api/v1/projects/:id/snapshots',
      validation: '/api/v1/projects/:id/validate',
      recovery: '/api/v1/projects/:id/recovery',
    },
  }));
};
