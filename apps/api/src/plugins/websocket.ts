// ============================================================
// @pgos/api — WebSocket Plugin
// Fastify integration with Socket.IO for real-time streams
// ============================================================

import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { Server } from 'socket.io';

declare module 'fastify' {
  interface FastifyInstance {
    io: Server;
  }
}

export const websocketPlugin = fp(async (server: FastifyInstance) => {
  // Attach Socket.IO to the underlying Node HTTP server
  const io = new Server(server.server, {
    cors: {
      origin: process.env.DASHBOARD_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  server.decorate('io', io);

  io.on('connection', (socket) => {
    server.log.info({ socketId: socket.id }, 'WebSocket client connected');

    // Subscribe to a specific project stream channel
    socket.on('project:subscribe', (projectId: string) => {
      socket.join(`project:${projectId}`);
      server.log.info({ socketId: socket.id, projectId }, 'Client subscribed to project channel');
      socket.emit('project:subscribed', { projectId, status: 'active' });
    });

    // Unsubscribe from a project stream channel
    socket.on('project:unsubscribe', (projectId: string) => {
      socket.leave(`project:${projectId}`);
      server.log.info({ socketId: socket.id, projectId }, 'Client unsubscribed from project channel');
    });

    socket.on('disconnect', () => {
      server.log.info({ socketId: socket.id }, 'WebSocket client disconnected');
    });
  });

  // Clean shutdown
  server.addHook('onClose', async () => {
    server.log.info('Closing WebSocket server...');
    io.close();
  });
});
