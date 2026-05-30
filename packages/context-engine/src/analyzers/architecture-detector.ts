// ============================================================
// @pgos/context-engine — Architecture Detector
// Detects architectural styles, layer structures, communication patterns,
// bounded contexts, and boundaries using AST evidence.
// ============================================================

import { basename, extname } from 'path';
import { ParsedFile } from '../parser/ast-parser.js';
import type {
  ArchitectureIntelligence,
  ArchitecturePattern,
  ArchitectureLayerDetail,
  CommunicationPattern,
  BoundaryDefinition,
} from '@pgos/core';

/**
 * Detects architectural patterns based on file structures and semantic content.
 */
export function detectArchitecture(
  rootPath: string,
  files: ParsedFile[],
  modules: any[] = []
): ArchitectureIntelligence {
  const allPaths = files.map(f => f.path.toLowerCase());
  const allImports = files.flatMap(f => f.rawImports);
  const evidence: string[] = [];
  const scores: Record<ArchitecturePattern, number> = {
    monolith: 10,
    microservices: 0,
    ddd: 0,
    'clean-architecture': 0,
    layered: 0,
    'event-driven': 0,
    cqrs: 0,
    hexagonal: 0,
    plugin: 0,
    serverless: 0,
    'modular-monolith': 0,
    unknown: 0,
  };

  const hasDomain = allPaths.some(p => /\/domain\//.test(p));
  const hasInfra = allPaths.some(p => /\/infrastructure\/|\/infra\//.test(p));
  const hasApplication = allPaths.some(p => /\/application\/|\/app\//.test(p));
  const hasRoutes = allPaths.some(p => /\/routes?\/|\/controllers?\//.test(p)) || files.some(f => f.routes.length > 0);
  const hasServices = allPaths.some(p => /\/services?\//.test(p));
  const hasRepositories = allPaths.some(p => /\/repositor|\/dao\/|\/data\//.test(p));
  const hasPorts = allPaths.some(p => /\/ports?\//.test(p));
  const hasAdapters = allPaths.some(p => /\/adapters?\//.test(p));
  const hasPackages = allPaths.some(p => /^packages\//.test(p)) || allPaths.some(p => /^apps\//.test(p));
  const hasCommands = allPaths.some(p => /\/commands?\//.test(p));
  const hasQueries = allPaths.some(p => /\/queries?\//.test(p));
  const hasEvents = allPaths.some(p => /\/events?\//.test(p)) || files.some(f => f.events.emits.length > 0 || f.events.listens.length > 0);
  const hasPlugins = allPaths.some(p => /\/plugins?\/|\/extensions?\//.test(p));

  // DDD
  if (hasDomain && hasInfra) {
    scores['ddd'] += 50;
    evidence.push('Domain and Infrastructure directories detected (DDD style)');
  }
  // Hexagonal
  if (hasPorts && hasAdapters) {
    scores['hexagonal'] += 60;
    evidence.push('Ports and Adapters directories detected (Hexagonal style)');
  }
  // Clean Architecture
  if (hasDomain && hasApplication && hasInfra) {
    scores['clean-architecture'] += 55;
    evidence.push('Clean Architecture layers (Domain, Application, Infrastructure) detected');
  }
  // CQRS
  if (hasCommands && hasQueries) {
    scores['cqrs'] += 50;
    evidence.push('Commands and Queries directories detected (CQRS separation)');
  }
  // Event Driven
  if (hasEvents) {
    scores['event-driven'] += 40;
    evidence.push('Event publishers or subscribers detected');
  }
  // Modular Monolith / Monorepo
  if (hasPackages) {
    scores['modular-monolith'] += 45;
    evidence.push('Multiple packages/apps workspace folders found');
  }
  // Plugin
  if (hasPlugins) {
    scores['plugin'] += 40;
    evidence.push('Plugins/extensions architecture directories found');
  }
  // Layered
  if (hasRoutes && hasServices && hasRepositories) {
    scores['layered'] += 65;
    evidence.push('Classic Routes -> Services -> Repositories layered structures found');
  } else if (hasRoutes && hasServices) {
    scores['layered'] += 40;
    evidence.push('Routes -> Services layered structures found');
  }

  // Framework detection
  let detectedFramework = 'TypeScript App';
  const frameworkKeywords = [
    { name: 'Fastify', imports: ['fastify'], arch: 'layered' as ArchitecturePattern },
    { name: 'Express', imports: ['express'], arch: 'layered' as ArchitecturePattern },
    { name: 'NestJS', imports: ['@nestjs'], arch: 'layered' as ArchitecturePattern },
    { name: 'Next.js', imports: ['next'], arch: 'modular-monolith' as ArchitecturePattern },
  ];

  for (const fw of frameworkKeywords) {
    if (fw.imports.some(imp => allImports.some(ai => ai.includes(imp)))) {
      detectedFramework = fw.name;
      scores[fw.arch] += 25;
      evidence.push(`Framework ${fw.name} detected from module imports`);
    }
  }

  // Find pattern with highest score
  const sortedPatterns = (Object.entries(scores) as [ArchitecturePattern, number][])
    .sort((a, b) => b[1] - a[1]);
  
  const winner = sortedPatterns[0][0];
  const confidence = Math.min(98, Math.max(20, sortedPatterns[0][1]));

  // Build layers
  const layers: ArchitectureLayerDetail[] = [];
  if (hasRoutes) {
    layers.push({
      name: 'api',
      purpose: 'HTTP request handling and routing',
      directories: findDirs(allPaths, ['routes', 'controllers', 'api']),
      components: files.filter(f => f.routes.length > 0).map(f => basename(f.path, extname(f.path))),
      allowedDependencies: ['service', 'domain', 'core'],
      forbiddenDependencies: ['db', 'repository'],
      entryPoints: files.filter(f => f.routes.length > 0 && f.path.includes('main') || f.path.includes('app')).map(f => f.path),
    });
  }
  if (hasServices) {
    layers.push({
      name: 'service',
      purpose: 'Business logic execution and orchestration',
      directories: findDirs(allPaths, ['services', 'usecases', 'application']),
      components: files.filter(f => f.path.includes('service')).map(f => basename(f.path, extname(f.path))),
      allowedDependencies: ['repository', 'domain', 'core'],
      forbiddenDependencies: ['api'],
      entryPoints: [],
    });
  }
  if (hasRepositories) {
    layers.push({
      name: 'backend',
      purpose: 'Data persistence and databases storage access',
      directories: findDirs(allPaths, ['repositories', 'dao', 'db', 'database']),
      components: files.filter(f => f.path.includes('repo') || f.path.includes('db')).map(f => basename(f.path, extname(f.path))),
      allowedDependencies: ['domain', 'core'],
      forbiddenDependencies: ['api', 'service'],
      entryPoints: files.filter(f => f.path.includes('main') || f.path.includes('app') || f.path.includes('index')).map(f => f.path),
    });
  }

  // Fallback default layer if none are matched
  if (layers.length === 0) {
    layers.push({
      name: 'backend',
      purpose: 'Application business and database capabilities',
      directories: ['src'],
      components: files.map(f => basename(f.path, extname(f.path))),
      allowedDependencies: [],
      forbiddenDependencies: [],
      entryPoints: files.filter(f => /main|app|index/i.test(f.path)).map(f => f.path),
    });
  }

  // Communication patterns
  const communication: CommunicationPattern[] = [];
  if (hasRoutes || allImports.some(i => i.includes('fastify') || i.includes('express') || i.includes('http'))) {
    communication.push({
      from: 'client',
      to: 'backend',
      protocol: 'http',
      description: `Inbound REST HTTP API endpoints via ${detectedFramework}`,
    });
  }
  if (hasEvents) {
    communication.push({
      from: 'services',
      to: 'events-broker',
      protocol: 'event',
      description: 'Asynchronous pub/sub event communications',
    });
  }

  // Boundaries definitions
  const boundaries: BoundaryDefinition[] = [];
  if (modules && modules.length > 0) {
    for (const m of modules) {
      boundaries.push({
        name: m.name,
        type: 'module',
        components: files.filter(f => f.path.includes(m.path)).map(f => f.path),
        publicApi: files.filter(f => f.path.includes(m.path)).flatMap(f => f.exports),
      });
    }
  } else {
    // Infer directories as boundaries
    const topDirs = new Set(allPaths.map(p => p.split('/')[1] || p.split('/')[0]).filter(Boolean));
    for (const dir of topDirs) {
      if (['__tests__', 'node_modules', 'dist', 'build'].includes(dir)) continue;
      const components = files.filter(f => f.path.startsWith(`src/${dir}`) || f.path.startsWith(dir)).map(f => f.path);
      if (components.length > 0) {
        boundaries.push({
          name: dir,
          type: 'module',
          components,
          publicApi: files.filter(f => f.path.startsWith(`src/${dir}`) || f.path.startsWith(dir)).flatMap(f => f.exports).slice(0, 10),
        });
      }
    }
  }

  // Principles
  const principles = [
    'Separation of Concerns (SoC)',
    'Single Responsibility Principle (SRP)',
    'Layer Dependency Rules Compliance',
  ];
  if (winner === 'ddd' || winner === 'clean-architecture') {
    principles.push('Domain Centric Architecture', 'Dependency Inversion Rule');
  }

  return {
    detectedPattern: winner,
    confidence,
    evidence,
    layers,
    communication,
    boundaries,
    principles,
  };
}

function findDirs(paths: string[], keywords: string[]): string[] {
  const found = new Set<string>();
  for (const p of paths) {
    for (const kw of keywords) {
      const parts = p.split('/');
      const idx = parts.findIndex(part => part === kw || part.startsWith(kw));
      if (idx >= 0) {
        found.add(parts.slice(0, idx + 1).join('/'));
      }
    }
  }
  return [...found].slice(0, 5);
}
