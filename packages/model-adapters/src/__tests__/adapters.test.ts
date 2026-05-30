import { describe, it, expect } from 'vitest';
import { OpenAIAdapter } from '../openai/adapter.js';
import { AnthropicAdapter } from '../anthropic/adapter.js';

describe('PGOS Model Adapters', () => {
  describe('OpenAI Adapter', () => {
    it('should initialize with correct configuration', () => {
      const adapter = new OpenAIAdapter({
        model: 'gpt-4o',
        apiKey: 'test-key',
      } as any);

      expect(adapter.provider).toBe('openai');
      expect(adapter.config.model).toBe('gpt-4o');
    });

    it('should declare capabilities correctly', () => {
      const adapter = new OpenAIAdapter({
        model: 'gpt-4o',
        apiKey: 'test-key',
      } as any);

      expect(adapter.supports('chat')).toBe(true);
      expect(adapter.supports('vision')).toBe(true);
      expect(adapter.supports('embedding')).toBe(false);
    });

    it('should format request messages correctly via buildMessages', async () => {
      const adapter = new OpenAIAdapter({ model: 'gpt-4', apiKey: 'test' } as any);
      await adapter.loadContext('Project X');
      
      const request = {
        messages: [{ role: 'user' as const, content: 'Hello' }],
        systemPrompt: 'You are an AI',
      };

      // We can test this indirectly by accessing the protected method
      const messages = (adapter as any).buildMessages(request);
      
      expect(messages.length).toBe(2);
      expect(messages[0].role).toBe('system');
      expect(messages[0].content).toContain('You are an AI');
      expect(messages[0].content).toContain('Project X');
      expect(messages[1].role).toBe('user');
      expect(messages[1].content).toBe('Hello');
    });
    
    it('should support export/import memory', async () => {
      const adapter = new OpenAIAdapter({ model: 'gpt-4', apiKey: 'test' } as any);
      await adapter.loadContext('Context A');
      
      const memory = await adapter.exportMemory();
      expect(memory.context).toBe('Context A');
      expect(memory.provider).toBe('openai');
      
      const adapter2 = new OpenAIAdapter({ model: 'gpt-4', apiKey: 'test' } as any);
      await adapter2.importMemory(memory);
      
      const memory2 = await adapter2.exportMemory();
      expect(memory2.context).toBe('Context A');
      expect(memory2.sessionId).toBe(memory.sessionId);
    });
  });

  describe('Anthropic Adapter', () => {
    it('should initialize with correct configuration', () => {
      const adapter = new AnthropicAdapter({
        model: 'claude-3-opus',
        apiKey: 'test-key',
      } as any);

      expect(adapter.provider).toBe('anthropic');
      expect(adapter.config.model).toBe('claude-3-opus');
    });

    it('should declare capabilities correctly', () => {
      const adapter = new AnthropicAdapter({
        model: 'claude-3-5-sonnet',
        apiKey: 'test-key',
      } as any);

      expect(adapter.supports('chat')).toBe(true);
      expect(adapter.supports('vision')).toBe(true);
      expect(adapter.supports('function_calling')).toBe(true);
    });
  });
});
