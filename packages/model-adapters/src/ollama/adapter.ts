// ============================================================
// @pgos/model-adapters — Ollama Adapter
// Local model support via Ollama
// ============================================================

import {
  type ModelRequest,
  type ModelResponse,
  type ModelValidation,
  type ModelCapability,
  type ModelConfig,
  componentLogger,
} from '@pgos/core';
import { BaseAdapter } from '../base/adapter.js';

const log = componentLogger('ollama-adapter');

export class OllamaAdapter extends BaseAdapter {
  private baseUrl: string;

  constructor(config: ModelConfig) {
    super('ollama', 'Ollama', config);
    this.baseUrl = config.baseUrl || 'http://localhost:11434';
  }

  async execute(request: ModelRequest): Promise<ModelResponse> {
    const startTime = Date.now();
    const messages = this.buildMessages(request);

    const body = {
      model: this.config.model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      stream: false,
      options: {
        temperature: request.temperature ?? this.config.temperature,
        num_predict: request.maxTokens || this.config.maxTokens,
      },
    };

    const response = await this.httpRequest(`${this.baseUrl}/api/chat`, body) as OllamaChatResponse;
    const latencyMs = Date.now() - startTime;

    // Store messages
    for (const msg of request.messages) {
      this.messages.push(msg);
    }
    this.messages.push({ role: 'assistant', content: response.message?.content || '' });

    log.debug({
      model: this.config.model,
      tokensIn: response.prompt_eval_count,
      tokensOut: response.eval_count,
      latencyMs,
    }, 'Ollama execution complete');

    return {
      content: response.message?.content || '',
      tokensInput: response.prompt_eval_count || 0,
      tokensOutput: response.eval_count || 0,
      model: this.config.model,
      provider: 'ollama',
      finishReason: response.done ? 'stop' : 'length',
      cost: 0, // Local model = free
      latencyMs,
    };
  }

  async validate(): Promise<ModelValidation> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json() as { models: { name: string }[] };
      const modelAvailable = data.models?.some((m) => m.name.includes(this.config.model));

      return {
        connected: true,
        modelAvailable: !!modelAvailable,
        capabilities: ['chat', 'completion'],
        maxContextWindow: 4096, // Varies by model
      };
    } catch (error) {
      return {
        connected: false,
        modelAvailable: false,
        capabilities: [],
        maxContextWindow: 0,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  supports(capability: ModelCapability): boolean {
    return ['chat', 'completion', 'streaming'].includes(capability);
  }
}

interface OllamaChatResponse {
  model: string;
  message?: { role: string; content: string };
  done: boolean;
  prompt_eval_count?: number;
  eval_count?: number;
}
