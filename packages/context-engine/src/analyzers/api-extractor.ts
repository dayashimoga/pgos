// ============================================================
// @pgos/context-engine — API Extractor
// Extracts API endpoints, schemas, auth patterns, and websocket channels.
// ============================================================

import { ParsedFile } from '../parser/ast-parser.js';
import type { APIIntelligence, APIEndpoint } from '@pgos/core';

export function extractAPIIntelligence(mockRoot: string, files: ParsedFile[]): APIIntelligence {
  const endpoints: APIEndpoint[] = [];
  const authPatterns = new Set<string>();

  for (const f of files) {
    // Collect endpoints
    for (const r of f.routes) {
      endpoints.push({
        method: r.method as any,
        path: r.path,
        handler: f.functions.find(fn => fn.line >= r.line)?.name || 'handler',
        file: r.file,
        auth: f.path.includes('auth') || r.path.includes('auth') || f.rawImports.includes('jsonwebtoken') || f.decorators.includes('UseGuards'),
      });
    }

    // Check for auth patterns from imports
    if (f.rawImports.some(i => i.includes('jsonwebtoken') || i.includes('jwt'))) {
      authPatterns.add('JWT');
    }
    if (f.rawImports.some(i => i.includes('passport'))) {
      authPatterns.add('Passport');
    }
    if (f.rawImports.some(i => i.includes('oauth'))) {
      authPatterns.add('OAuth2');
    }
  }

  if (authPatterns.size === 0 && files.some(f => f.path.includes('auth') || f.path.includes('guard'))) {
    authPatterns.add('Custom API Authentication');
  }

  return {
    endpoints,
    schemas: [],
    authPatterns: [...authPatterns],
    errorPatterns: [],
    rateLimiting: files.some(f => f.rawImports.some(i => i.includes('rate-limit') || i.includes('limiter'))),
    websocketChannels: [],
  };
}
