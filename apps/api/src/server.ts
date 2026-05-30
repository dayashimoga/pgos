// ============================================================
// @pgos/api — Fastify Server
// Main API server for Project Guardian OS
// ============================================================

import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { createLogger, VERSION, DEFAULT_API_PORT } from '@pgos/core';
import { registerProjectRoutes } from './routes/projects.js';
import { registerContextRoutes } from './routes/context.js';
import { registerSnapshotRoutes } from './routes/snapshots.js';
import { registerValidationRoutes } from './routes/validation.js';
import { registerRecoveryRoutes } from './routes/recovery.js';
import { registerSystemRoutes } from './routes/system.js';
import { websocketPlugin } from './plugins/websocket.js';
import { registerGitRoutes } from './routes/git.js';
import { registerSessionRoutes } from './routes/sessions.js';
import { registerAgentRoutes } from './routes/agents.js';
import { registerMemoryRoutes } from './routes/memory.js';
import { registerDocRoutes } from './routes/docs.js';

// Load environment variables
import 'dotenv/config';

const log = createLogger({ name: 'pgos-api' });

async function buildServer() {
  const server = Fastify({
    logger: {
      level: process.env.API_LOG_LEVEL || 'info',
      transport: process.env.NODE_ENV !== 'production'
        ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard' } }
        : undefined,
    },
  });

  // Security
  await server.register(helmet, { contentSecurityPolicy: false });
  await server.register(cors, {
    origin: process.env.DASHBOARD_URL || 'http://localhost:3000',
    credentials: true,
  });
  await server.register(rateLimit, {
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    timeWindow: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  });

  // WebSockets
  await server.register(websocketPlugin);

  // Health check
  server.get('/health', async () => ({
    status: 'healthy',
    version: VERSION,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  }));

  // API routes
  await server.register(registerSystemRoutes, { prefix: '/api/v1/system' });
  await server.register(registerProjectRoutes, { prefix: '/api/v1/projects' });
  await server.register(registerContextRoutes, { prefix: '/api/v1/projects' });
  await server.register(registerSnapshotRoutes, { prefix: '/api/v1/projects' });
  await server.register(registerValidationRoutes, { prefix: '/api/v1/projects' });
  await server.register(registerRecoveryRoutes, { prefix: '/api/v1/projects' });
  await server.register(registerGitRoutes, { prefix: '/api/v1/projects' });
  await server.register(registerSessionRoutes, { prefix: '/api/v1/projects' });
  await server.register(registerAgentRoutes, { prefix: '/api/v1/projects' });
  await server.register(registerMemoryRoutes, { prefix: '/api/v1/projects' });
  await server.register(registerDocRoutes, { prefix: '/api/v1/projects' });

  // Global error handler
  server.setErrorHandler((error, request, reply) => {
    const statusCode = (error as { statusCode?: number }).statusCode || 500;
    const code = (error as { code?: string }).code || 'INTERNAL_ERROR';

    server.log.error({
      err: error,
      request: { method: request.method, url: request.url },
    });

    const message = error instanceof Error ? error.message : String(error);

    reply.status(statusCode).send({
      error: {
        code,
        message,
        statusCode,
      },
    });
  });

  return server;
}

async function start() {
  const server = await buildServer();
  const port = parseInt(process.env.API_PORT || String(DEFAULT_API_PORT), 10);
  const host = process.env.API_HOST || '0.0.0.0';

  try {
    await server.listen({ port, host });
    console.log(`\n  ⚡ PGOS API Server v${VERSION}`);
    console.log(`  📡 Listening on http://${host}:${port}`);
    console.log(`  🏥 Health: http://${host}:${port}/health`);
    console.log(`  📚 API: http://${host}:${port}/api/v1\n`);
  } catch (error) {
    server.log.error(error);
    process.exit(1);
  }

  // Graceful shutdown
  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
  for (const signal of signals) {
    process.on(signal, async () => {
      log.info({ signal }, 'Shutting down...');
      await server.close();
      process.exit(0);
    });
  }
}

start();

export { buildServer };
