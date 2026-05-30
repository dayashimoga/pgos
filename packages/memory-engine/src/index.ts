// ============================================================
// @pgos/memory-engine — Entry Point
// Persistent project memory with filesystem load/save capabilities
// ============================================================

import { readFile, writeFile, mkdir } from 'fs/promises';
import { dirname } from 'path';
import {
  type Memory,
  type MemoryType,
  type MemoryQuery,
  type MemorySearchResult,
  type MemoryMetadata,
  generateId,
  componentLogger,
  fileExists,
} from '@pgos/core';

const log = componentLogger('memory-engine');

/**
 * MemoryStore with filesystem persistence capabilities for cross-session evolution
 */
class MemoryStore {
  private memories: Map<string, Memory> = new Map();

  async store(
    projectId: string,
    type: MemoryType,
    content: string,
    metadata: Partial<MemoryMetadata> = {}
  ): Promise<Memory> {
    const memory: Memory = {
      id: generateId(),
      projectId,
      type,
      content,
      metadata: {
        source: metadata.source,
        sessionId: metadata.sessionId,
        modelProvider: metadata.modelProvider,
        relatedFiles: metadata.relatedFiles || [],
        tags: metadata.tags || [],
        importance: metadata.importance || 'medium',
      },
      relevanceScore: 1.0,
      createdAt: new Date(),
      accessedAt: new Date(),
    };

    this.memories.set(memory.id, memory);
    log.debug({ id: memory.id, type, projectId }, 'Memory stored');

    return memory;
  }

  async search(query: MemoryQuery): Promise<MemorySearchResult> {
    const startTime = Date.now();
    let results = Array.from(this.memories.values())
      .filter((m) => m.projectId === query.projectId);

    if (query.types && query.types.length > 0) {
      results = results.filter((m) => query.types!.includes(m.type));
    }

    if (query.tags && query.tags.length > 0) {
      results = results.filter((m) =>
        query.tags!.some((tag) => m.metadata.tags?.includes(tag))
      );
    }

    if (query.query) {
      const q = query.query.toLowerCase();
      results = results.filter((m) => m.content.toLowerCase().includes(q));
    }

    if (query.minRelevance) {
      results = results.filter((m) => m.relevanceScore >= query.minRelevance!);
    }

    // Sort
    switch (query.sortBy) {
      case 'recency':
        results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        break;
      case 'importance':
        const importanceOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        results.sort((a, b) =>
          (importanceOrder[b.metadata.importance || 'medium'] || 0) -
          (importanceOrder[a.metadata.importance || 'medium'] || 0)
        );
        break;
      default:
        results.sort((a, b) => b.relevanceScore - a.relevanceScore);
    }

    const total = results.length;
    const offset = query.offset || 0;
    const limit = query.limit || 20;
    results = results.slice(offset, offset + limit);

    // Update access time
    for (const memory of results) {
      memory.accessedAt = new Date();
    }

    return {
      memories: results,
      total,
      query: query.query || '',
      searchTime: Date.now() - startTime,
    };
  }

  async get(id: string): Promise<Memory | null> {
    return this.memories.get(id) || null;
  }

  async delete(id: string): Promise<boolean> {
    return this.memories.delete(id);
  }

  async getProjectMemories(projectId: string): Promise<Memory[]> {
    return Array.from(this.memories.values()).filter((m) => m.projectId === projectId);
  }

  async consolidate(projectId: string): Promise<{ processed: number; merged: number }> {
    const memories = await this.getProjectMemories(projectId);
    log.info({ projectId, memories: memories.length }, 'Memory consolidation run');
    return { processed: memories.length, merged: 0 };
  }

  // ─── Filesystem Persistence ─────────────────────────────────

  async loadFromFile(filePath: string): Promise<void> {
    if (!(await fileExists(filePath))) {
      log.debug({ filePath }, 'Memory file does not exist, skipping load');
      return;
    }

    try {
      const content = await readFile(filePath, 'utf-8');
      const data = JSON.parse(content);

      if (Array.isArray(data)) {
        // Simple list of memory items
        for (const item of data) {
          const memory = this.inflateMemory(item);
          this.memories.set(memory.id, memory);
        }
      } else if (data.memories && Array.isArray(data.memories)) {
        // Wrapped list
        for (const item of data.memories) {
          const memory = this.inflateMemory(item);
          this.memories.set(memory.id, memory);
        }
      } else if (typeof data === 'object') {
        // High level structured project memory mapping
        const keys = ['historicalDecisions', 'rejectedIdeas', 'activeWork', 'plannedWork', 'lastEdits', 'knownFailures', 'lessonsLearned', 'roadmap', 'evolutionHistory'];
        for (const key of keys) {
          const arr = data[key];
          if (Array.isArray(arr)) {
            for (const item of arr) {
              const memoryText = typeof item === 'string' ? item : JSON.stringify(item);
              await this.store('default', key as MemoryType, memoryText, {
                tags: [key],
                importance: 'medium',
              });
            }
          }
        }
      }
      log.info({ count: this.memories.size, filePath }, 'Loaded project memories from file');
    } catch (err) {
      log.error({ err, filePath }, 'Failed to load memories from file');
    }
  }

  async saveToFile(filePath: string): Promise<void> {
    try {
      const parentDir = dirname(filePath);
      await mkdir(parentDir, { recursive: true });

      const list = Array.from(this.memories.values());
      const data = {
        memories: list,
        savedAt: new Date().toISOString(),
        count: list.length,
      };

      await writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
      log.info({ count: list.length, filePath }, 'Saved project memories to file');
    } catch (err) {
      log.error({ err, filePath }, 'Failed to save memories to file');
    }
  }

  private inflateMemory(item: any): Memory {
    return {
      id: item.id || generateId(),
      projectId: item.projectId || 'default',
      type: item.type || 'lesson',
      content: item.content || '',
      metadata: {
        source: item.metadata?.source,
        sessionId: item.metadata?.sessionId,
        modelProvider: item.metadata?.modelProvider,
        relatedFiles: item.metadata?.relatedFiles || [],
        tags: item.metadata?.tags || [],
        importance: item.metadata?.importance || 'medium',
      },
      relevanceScore: item.relevanceScore || 1.0,
      createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
      accessedAt: item.accessedAt ? new Date(item.accessedAt) : new Date(),
    };
  }
}

export const memoryStore = new MemoryStore();
export { MemoryStore };
