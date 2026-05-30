// ============================================================
// @pgos/context-engine — Runtime Analyzer
// Outline startup, request processing, failure, and recovery flows.
// ============================================================

import { ParsedFile } from '../parser/ast-parser.js';
import type { ExecutionFlows, ExecutionStep } from '@pgos/core';

export function analyzeRuntime(mockRoot: string, files: ParsedFile[]): ExecutionFlows {
  const entryFiles = files.filter(f => f.path.includes('main') || f.path.includes('app') || f.path.includes('index'));
  const entryPoint = entryFiles[0]?.path || 'src/main.ts';

  // Build Startup steps
  const startupSteps: ExecutionStep[] = [
    { order: 0, action: 'Bootstrap application environment settings', file: entryPoint, description: 'Verify node runtime and load local .env parameters configurations.', async: false },
  ];

  if (files.some(f => f.path.includes('db') || f.path.includes('conn'))) {
    startupSteps.push({
      order: 1,
      action: 'Initialize Database Connection',
      file: files.find(f => f.path.includes('db') || f.path.includes('conn'))?.path || entryPoint,
      description: 'Establish connection pools to the backing relational database.',
      async: true,
    });
  }

  startupSteps.push({
    order: startupSteps.length,
    action: 'Mount server routing endpoint handlers',
    file: entryPoint,
    description: 'Bind Express/Fastify routes to their functional handlers.',
    async: true,
  });

  // Build Request processing steps
  const requestSteps: ExecutionStep[] = [];
  if (files.some(f => f.path.includes('middleware') || f.path.includes('guard'))) {
    requestSteps.push({
      order: 0,
      action: 'Run Authentication guards middleware chain',
      file: files.find(f => f.path.includes('middleware') || f.path.includes('guard'))?.path || entryPoint,
      description: 'Verify client tokens permissions signatures.',
      async: true,
    });
  }

  requestSteps.push({
    order: requestSteps.length,
    action: 'Route execution mapping',
    file: entryPoint,
    description: 'Dispatch endpoint request to business capabilities services.',
    async: true,
  });

  return {
    startup: {
      name: 'startup',
      description: 'Application boot and components loading process.',
      steps: startupSteps,
      entryPoint,
    },
    request: {
      name: 'request',
      description: 'HTTP request handling workflow.',
      steps: requestSteps,
    },
    failure: {
      name: 'failure',
      description: 'Exceptions fallback boundary logging.',
      steps: [
        { order: 0, action: 'Catch server side uncaught exception', file: entryPoint, description: 'Catch, format, and report failure stack to logs.', async: false },
      ],
    },
    recovery: {
      name: 'recovery',
      description: 'Process recovery and self-healing lifecycle.',
      steps: [],
    },
    shutdown: {
      name: 'shutdown',
      description: 'Graceful shutdown handling processes.',
      steps: [
        { order: 0, action: 'Drain remaining active requests', file: entryPoint, description: 'Wait for requests to complete, then close socket bindings.', async: true },
      ],
    },
  };
}
