// ============================================================
// @pgos/core — Memory Types
// Type definitions for the Memory Engine
// ============================================================

export interface Memory {
  id: string;
  projectId: string;
  type: MemoryType;
  content: string;
  embedding?: number[];
  metadata: MemoryMetadata;
  relevanceScore: number;
  createdAt: Date;
  accessedAt: Date;
}

export type MemoryType =
  | 'decision'
  | 'pattern'
  | 'constraint'
  | 'lesson'
  | 'bug'
  | 'architecture'
  | 'preference'
  | 'context'
  | 'conversation'
  | 'requirement';

export interface MemoryMetadata {
  source?: string;
  sessionId?: string;
  modelProvider?: string;
  relatedFiles?: string[];
  tags?: string[];
  importance?: 'low' | 'medium' | 'high' | 'critical';
  expiresAt?: Date;
}

export interface MemoryQuery {
  projectId: string;
  query?: string;
  types?: MemoryType[];
  tags?: string[];
  minRelevance?: number;
  limit?: number;
  offset?: number;
  sortBy?: 'relevance' | 'recency' | 'importance';
}

export interface MemorySearchResult {
  memories: Memory[];
  total: number;
  query: string;
  searchTime: number;
}

export interface MemoryConsolidation {
  projectId: string;
  memoriesProcessed: number;
  memoriesMerged: number;
  memoriesArchived: number;
  memoriesDeleted: number;
  duration: number;
}

export interface MemoryExport {
  projectId: string;
  memories: Memory[];
  exportedAt: Date;
  format: 'json' | 'yaml' | 'markdown';
}

export interface MemoryImport {
  projectId: string;
  source: string;
  memoriesImported: number;
  duplicatesSkipped: number;
  errors: string[];
}
