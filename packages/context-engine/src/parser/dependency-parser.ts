// ============================================================
// @pgos/context-engine — Dependency Parser
// Resolves relative imports, tracks dependency edges, detects cycles,
// aggregates external modules, and identifies single points of failure.
// ============================================================

import { join, dirname, resolve, relative } from 'path';
import { listFilesRecursive } from '@pgos/core';
import { parseFiles, ParsedFile } from './ast-parser.js';

export interface DependencyGraph {
  nodes: string[];
  edges: { from: string; to: string }[];
  circular: string[][];
  external: { name: string; usedBy: string[] }[];
  inDegree: Record<string, number>;
  outDegree: Record<string, number>;
  spofs: { path: string; dependents: number }[];
}

/**
 * Builds a complete semantic dependency graph of a codebase.
 */
export async function buildDependencyGraph(rootPath: string): Promise<DependencyGraph> {
  const resolvedRoot = resolve(rootPath);
  
  // Recursively discover all code files
  const filePaths = await listFilesRecursive(resolvedRoot);
  const parsedFiles = await parseFiles(filePaths, resolvedRoot);
  
  const nodes = parsedFiles.map(f => f.path);
  const edges: { from: string; to: string }[] = [];
  const adjList: Record<string, string[]> = {};
  const inDegree: Record<string, number> = {};
  const outDegree: Record<string, number> = {};

  // Initialize degree maps
  for (const node of nodes) {
    adjList[node] = [];
    inDegree[node] = 0;
    outDegree[node] = 0;
  }

  // Resolve imports to construct edges
  for (const f of parsedFiles) {
    for (const imp of f.imports) {
      if (imp.isExternal) continue;
      
      const resolved = resolveImportPath(f.path, imp.source, nodes);
      if (resolved && resolved !== f.path) {
        edges.push({ from: f.path, to: resolved });
        adjList[f.path].push(resolved);
        inDegree[resolved] = (inDegree[resolved] || 0) + 1;
        outDegree[f.path]++;
      }
    }
  }

  // Detect circular dependencies (DFS Cycle Finding)
  const circular: string[][] = [];
  const WHITE = 0, GRAY = 1, BLACK = 2;
  const color: Record<string, number> = {};
  
  for (const n of nodes) color[n] = WHITE;

  function dfs(u: string, path: string[]) {
    color[u] = GRAY;
    path.push(u);
    for (const v of (adjList[u] || [])) {
      if (color[v] === GRAY) {
        // Cycle found
        const cycleStartIndex = path.indexOf(v);
        if (cycleStartIndex >= 0) {
          circular.push([...path.slice(cycleStartIndex), v]);
        }
      } else if (color[v] === WHITE) {
        dfs(v, [...path]);
      }
    }
    color[u] = BLACK;
  }

  for (const n of nodes) {
    if (color[n] === WHITE) dfs(n, []);
  }

  // External dependencies
  const externalMap: Record<string, Set<string>> = {};
  for (const f of parsedFiles) {
    for (const imp of f.imports) {
      if (imp.isExternal) {
        const pkg = imp.source.startsWith('@') 
          ? imp.source.split('/').slice(0, 2).join('/') 
          : imp.source.split('/')[0];
        
        if (!externalMap[pkg]) externalMap[pkg] = new Set();
        externalMap[pkg].add(f.path);
      }
    }
  }

  const external = Object.entries(externalMap).map(([name, usedBy]) => ({
    name,
    usedBy: [...usedBy],
  }));

  // SPOFs: files with high in-degree (>= 3) that do not have tests
  const spofs = Object.entries(inDegree)
    .filter(([path, deg]) => {
      const fileObj = parsedFiles.find(f => f.path === path);
      return deg >= 3 && fileObj && !fileObj.hasTests;
    })
    .sort((a, b) => b[1] - a[1])
    .map(([path, deg]) => ({
      path,
      dependents: deg,
    }));

  return {
    nodes,
    edges,
    circular: circular.slice(0, 10), // Limit to top 10 cycles
    external,
    inDegree,
    outDegree,
    spofs,
  };
}

/**
 * Resolves relative import sources against known codebase files.
 */
export function resolveImportPath(
  currentFile: string,
  importSource: string,
  allFiles: string[]
): string | null {
  if (!importSource.startsWith('.')) return null;

  const dir = dirname(currentFile);
  let resolved = join(dir, importSource).replace(/\\/g, '/');

  // Strip trailing slashes
  if (resolved.endsWith('/')) resolved = resolved.slice(0, -1);

  // Strip common import formats (e.g. strip .js/.ts to search base)
  const baseResolved = resolved.replace(/\.(js|ts|tsx|jsx|mjs|cjs)$/, '');

  const candidates = [
    resolved,
    baseResolved + '.ts',
    baseResolved + '.tsx',
    baseResolved + '.js',
    baseResolved + '.jsx',
    baseResolved + '/index.ts',
    baseResolved + '/index.js',
  ];

  for (const c of candidates) {
    // Normalize path matches
    const normalizedCandidate = c.replace(/\\/g, '/');
    if (allFiles.includes(normalizedCandidate)) return normalizedCandidate;
  }

  return null;
}
