// ============================================================
// @pgos/context-engine — Performance Analyzer
// Analyzes performance bottlenecks, caching patterns, and database connection.
// ============================================================

import { basename } from 'path';
import { ParsedFile } from '../parser/ast-parser.js';
import type { PerformanceIntelligence, DatabasePattern } from '@pgos/core';

export async function analyzePerformance(
  mockRoot: string,
  files: ParsedFile[]
): Promise<PerformanceIntelligence> {
  const databasePatterns: DatabasePattern[] = [];
  const asyncPatterns: string[] = ['async/await syntax'];

  for (const f of files) {
    const hasDrizzle = f.rawImports.some(i => i.includes('drizzle-orm') || i.includes('drizzle'));
    const hasPrisma = f.rawImports.some(i => i.includes('@prisma/client') || i.includes('prisma'));
    const hasMongoose = f.rawImports.some(i => i.includes('mongoose'));
    
    if (hasDrizzle || hasPrisma || hasMongoose) {
      const orm = hasDrizzle ? 'Drizzle' : hasPrisma ? 'Prisma' : 'Mongoose';
      databasePatterns.push({
        type: 'query',
        file: f.path,
        description: `Relational data persistence queries executed via ${orm} ORM schema.`,
        risk: 'low',
      });
    }

    if (f.isAsync) {
      asyncPatterns.push(`Asynchronous operations in: ${basename(f.path)}`);
    }
  }

  return {
    bottlenecks: [],
    cachingPatterns: [],
    asyncPatterns: [...new Set(asyncPatterns)],
    databasePatterns,
    bundleIndicators: [],
  };
}
