import { describe, it, expect, afterAll } from 'vitest';
import { SubAgent, Orchestrator, AgentMemoryCache } from '../index.js';
import { join, dirname } from 'path';
import { mkdir, writeFile, rm } from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('PGOS Agent Runtime', () => {
  const mockRoot = join(__dirname, 'mock-project-agent');

  afterAll(async () => {
    await rm(mockRoot, { recursive: true, force: true });
  });

  describe('SubAgent', () => {
    it('should perform real architecture analysis', async () => {
      await mkdir(join(mockRoot, 'src'), { recursive: true });
      await writeFile(join(mockRoot, 'src', 'app.ts'), 'export function main() { return "hello"; }');
      await writeFile(join(mockRoot, 'package.json'), JSON.stringify({ name: 'test' }));

      const agent = new SubAgent('agent-1', 'architect', 'Architect Agent', 'local');
      const task = {
        id: 'task-1',
        projectId: 'test-project',
        agentType: 'architect' as const,
        description: 'Analyze architecture',
        input: { instructions: 'review', context: '' },
        status: 'running' as const,
        tokensUsed: 0,
        createdAt: new Date(),
      };

      const decision = await agent.decide(task, '', { rootPath: mockRoot });

      expect(decision).toBeDefined();
      expect(decision.thought).toBeDefined();
      expect(decision.thought.length).toBeGreaterThan(10);
      expect(decision.action).toBeDefined();
      expect(decision.target).toBe(mockRoot);
      expect(decision.findings).toBeDefined();
      expect(decision.findings!.length).toBeGreaterThan(0);
    });

    it('should perform real code quality review', async () => {
      // Create files with quality issues
      await writeFile(join(mockRoot, 'src', 'bad.ts'), `
export function broken() {
  // TODO: fix this
  try { doSomething(); } catch (e) {}
  // FIXME: memory leak
}
`);

      const agent = new SubAgent('agent-2', 'reviewer', 'Reviewer Agent', 'local');
      const task = {
        id: 'task-2',
        projectId: 'test-project',
        agentType: 'reviewer' as const,
        description: 'Review code quality',
        input: { instructions: 'review', context: '' },
        status: 'running' as const,
        tokensUsed: 0,
        createdAt: new Date(),
      };

      const decision = await agent.decide(task, '', { rootPath: mockRoot });

      expect(decision.findings).toBeDefined();
      // Should detect the TODO, FIXME, and empty catch
      expect(decision.findings!.some((f) => f.includes('TODO'))).toBe(true);
    });

    it('should perform implementation gap analysis', async () => {
      const agent = new SubAgent('agent-3', 'coder', 'Coder Agent', 'local');
      const task = {
        id: 'task-3',
        projectId: 'test-project',
        agentType: 'coder' as const,
        description: 'Find implementation gaps',
        input: { instructions: 'analyze', context: '' },
        status: 'running' as const,
        tokensUsed: 0,
        createdAt: new Date(),
      };

      const decision = await agent.decide(task, '', { rootPath: mockRoot });

      expect(decision.findings).toBeDefined();
      expect(decision.findings!.some((f) => f.includes('Source files') || f.includes('Test files'))).toBe(true);
    });

    it('should handle errors in analysis gracefully', async () => {
      const agent = new SubAgent('agent-4', 'architect', 'Architect', 'local');
      const task = {
        id: 'task-4',
        projectId: 'test-project',
        agentType: 'architect' as const,
        description: 'Analyze',
        input: { instructions: 'analyze', context: '' },
        status: 'running' as const,
        tokensUsed: 0,
        createdAt: new Date(),
      };

      const decision = await agent.decide(task, '', { rootPath: '/nonexistent/path/12345' });
      // Should not throw, should return gracefully
      expect(decision).toBeDefined();
      expect(decision.action).toBeDefined();
    });
  });

  describe('Orchestrator', () => {
    it('should execute a real multi-agent pipeline', async () => {
      const orchestrator = new Orchestrator();
      orchestrator.registerAgent(new SubAgent('a1', 'architect', 'Arch', 'local'));
      orchestrator.registerAgent(new SubAgent('a2', 'reviewer', 'Review', 'local'));

      const tasks = await orchestrator.executeGoal('test', 'analyze codebase', '', mockRoot);

      expect(tasks.length).toBe(2);
      expect(tasks[0].status).toBe('completed');
      expect(tasks[1].status).toBe('completed');
      expect(tasks[0].output).toBeDefined();
      expect(tasks[0].output!.result.length).toBeGreaterThan(0);
      // Second task should reference first as parent
      expect(tasks[1].parentTaskId).toBe(tasks[0].id);
    });

    it('should track real timing in tasks', async () => {
      const orchestrator = new Orchestrator();
      orchestrator.registerAgent(new SubAgent('a1', 'coder', 'Coder', 'local'));

      const tasks = await orchestrator.executeGoal('test', 'find gaps', '', mockRoot);

      expect(tasks[0].startedAt).toBeDefined();
      expect(tasks[0].completedAt).toBeDefined();
      const duration = tasks[0].completedAt!.getTime() - tasks[0].startedAt!.getTime();
      expect(duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('AgentMemoryCache', () => {
    it('should save and retrieve traces in memory', async () => {
      const cache = new AgentMemoryCache();
      await cache.saveTrace('agent-1', 'Analyzed 50 files, found 3 issues');

      const trace = cache.getTrace('agent-1');
      expect(trace).toBe('Analyzed 50 files, found 3 issues');
    });

    it('should return null for non-existent traces', () => {
      const cache = new AgentMemoryCache();
      expect(cache.getTrace('nonexistent')).toBeNull();
    });

    it('should persist traces to disk and reload them', async () => {
      const cache1 = new AgentMemoryCache();
      await cache1.init(mockRoot);
      await cache1.saveTrace('persistent-agent', 'Important analysis results');

      // Create new cache and load from same path
      const cache2 = new AgentMemoryCache();
      await cache2.init(mockRoot);

      const trace = cache2.getTrace('persistent-agent');
      expect(trace).toBe('Important analysis results');
    });

    it('should consolidate all traces into a summary', async () => {
      const cache = new AgentMemoryCache();
      await cache.saveTrace('arch-agent', 'Architecture: 5 layers detected');
      await cache.saveTrace('review-agent', 'Quality: 3 issues found');

      const summary = cache.consolidate();
      expect(summary).toContain('Agent Memory Consolidation Report');
      expect(summary).toContain('arch-agent');
      expect(summary).toContain('review-agent');
    });

    it('should return all agent IDs', async () => {
      const cache = new AgentMemoryCache();
      await cache.saveTrace('a1', 'trace1');
      await cache.saveTrace('a2', 'trace2');

      const ids = cache.getAgentIds();
      expect(ids).toContain('a1');
      expect(ids).toContain('a2');
    });

    it('should clear all traces', async () => {
      const cache = new AgentMemoryCache();
      await cache.init(mockRoot);
      await cache.saveTrace('temp-agent', 'temp trace');
      await cache.clear();

      expect(cache.getTrace('temp-agent')).toBeNull();
      expect(cache.getAgentIds().length).toBe(0);
    });
  });
});
