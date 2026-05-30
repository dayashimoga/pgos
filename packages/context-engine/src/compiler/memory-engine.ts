// ============================================================
// @pgos/context-engine — AI Memory Engine
// Reads and commits state history records to project-memory.json,
// maintaining technical debt tracking, architecture decision records (ADRs),
// and roadmaps for multi-session agent coordination.
// ============================================================

import { promises as fs } from 'fs';
import { join } from 'path';

export interface DecisionRecord {
  title: string;
  rationale: string;
  date: string;
  impact: string;
  type: 'architectural' | 'technical' | 'migration';
}

export interface ProjectMemory {
  decisions: DecisionRecord[];
  adrs: { id: string; title: string; status: 'proposed' | 'accepted' | 'deprecated'; date: string }[];
  knownBugs: { id: string; description: string; file: string; line?: number }[];
  migrationHistory: { version: string; date: string; description: string }[];
  technicalDebtNotes: string[];
}

/**
 * Loads or initializes the project-memory.json intelligence state file.
 */
export async function loadProjectMemory(rootPath: string): Promise<ProjectMemory> {
  const memoryFilePath = join(rootPath, 'project-memory.json');
  try {
    const raw = await fs.readFile(memoryFilePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    // Default initial project memory
    return {
      decisions: [
        {
          title: 'Migrate to AIRB v3.0 next generation platform',
          rationale: 'Provide 28 distinct segments of deep codebase intelligence.',
          date: new Date().toISOString().substring(0, 10),
          impact: 'Drastically reduces token usage and improves execution confidence.',
          type: 'architectural',
        },
      ],
      adrs: [
        {
          id: 'ADR-001',
          title: 'Modular context engine architecture',
          status: 'accepted',
          date: new Date().toISOString().substring(0, 10),
        },
      ],
      knownBugs: [],
      migrationHistory: [
        {
          version: '3.0.0',
          date: new Date().toISOString().substring(0, 10),
          description: 'Evolve compiler context formats to support robust Multi-language AST telemetry.',
        },
      ],
      technicalDebtNotes: [
        'Evolve standard Fallback regex parsers to full tree-sitter AST nodes coverage.',
      ],
    };
  }
}

/**
 * Persists the updated project memory state to project-memory.json.
 */
export async function saveProjectMemory(rootPath: string, memory: ProjectMemory): Promise<void> {
  const memoryFilePath = join(rootPath, 'project-memory.json');
  await fs.writeFile(memoryFilePath, JSON.stringify(memory, null, 2), 'utf8');
}
