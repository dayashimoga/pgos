// ============================================================
// @pgos/model-adapters — Anthropic Adapter
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

const log = componentLogger('anthropic-adapter');

export class AnthropicAdapter extends BaseAdapter {
  private baseUrl: string;

  constructor(config: ModelConfig) {
    super('anthropic', 'Anthropic', config);
    this.baseUrl = config.baseUrl || 'https://api.anthropic.com/v1';
  }

  async execute(request: ModelRequest): Promise<ModelResponse> {
    const startTime = Date.now();
    const messages = this.buildMessages(request);

    // Anthropic separates system prompt from messages
    const systemParts: string[] = [];
    const userMessages: { role: string; content: string }[] = [];

    for (const msg of messages) {
      if (msg.role === 'system') {
        systemParts.push(msg.content);
      } else {
        userMessages.push({ role: msg.role, content: msg.content });
      }
    }

    const body: Record<string, unknown> = {
      model: this.config.model,
      max_tokens: request.maxTokens || this.config.maxTokens,
      messages: userMessages,
    };

    if (systemParts.length > 0) {
      body.system = systemParts.join('\n\n');
    }

    if (request.temperature !== undefined) {
      body.temperature = request.temperature;
    }

    if (request.tools && request.tools.length > 0) {
      body.tools = request.tools.map((t) => ({
        name: t.name,
        description: t.description,
        input_schema: t.parameters,
      }));
    }

    const response = await this.httpRequest(`${this.baseUrl}/messages`, body, {
      'x-api-key': this.config.apiKey || '',
      'anthropic-version': '2023-06-01',
    }) as AnthropicResponse;

    const content = response.content
      .filter((c) => c.type === 'text')
      .map((c) => c.text)
      .join('');

    const latencyMs = Date.now() - startTime;

    // Store messages for session continuity
    for (const msg of request.messages) {
      this.messages.push(msg);
    }
    this.messages.push({ role: 'assistant', content });

    log.debug({
      model: this.config.model,
      tokensIn: response.usage?.input_tokens,
      tokensOut: response.usage?.output_tokens,
      latencyMs,
    }, 'Anthropic execution complete');

    return {
      content,
      tokensInput: response.usage?.input_tokens || 0,
      tokensOutput: response.usage?.output_tokens || 0,
      model: response.model,
      provider: 'anthropic',
      finishReason: response.stop_reason === 'end_turn' ? 'stop' : 'length',
      toolCalls: response.content
        .filter((c) => c.type === 'tool_use')
        .map((c) => ({
          id: c.id || '',
          name: c.name || '',
          arguments: JSON.stringify(c.input || {}),
        })),
      cost: this.estimateCost(response.usage?.input_tokens || 0, response.usage?.output_tokens || 0),
      latencyMs,
    };
  }

  async validate(): Promise<ModelValidation> {
    try {
      // Anthropic doesn't have a models list endpoint — test with a minimal request
      await this.httpRequest(`${this.baseUrl}/messages`, {
        model: this.config.model,
        max_tokens: 1,
        messages: [{ role: 'user', content: 'hi' }],
      }, {
        'x-api-key': this.config.apiKey || '',
        'anthropic-version': '2023-06-01',
      });

      return {
        connected: true,
        modelAvailable: true,
        capabilities: ['chat', 'function_calling', 'streaming', 'vision'],
        maxContextWindow: this.getContextWindow(),
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
    const supported: ModelCapability[] = ['chat', 'function_calling', 'streaming', 'vision'];
    return supported.includes(capability);
  }

  private getContextWindow(): number {
    const model = this.config.model;
    if (model.includes('claude-3-5') || model.includes('claude-3.5')) return 200000;
    if (model.includes('claude-3')) return 200000;
    if (model.includes('claude-2')) return 100000;
    return 100000;
  }

  private estimateCost(inputTokens: number, outputTokens: number): number {
    const model = this.config.model;
    let inputPrice = 3.0;
    let outputPrice = 15.0;

    if (model.includes('haiku')) { inputPrice = 0.25; outputPrice = 1.25; }
    else if (model.includes('sonnet')) { inputPrice = 3.0; outputPrice = 15.0; }
    else if (model.includes('opus')) { inputPrice = 15.0; outputPrice = 75.0; }

    return (inputTokens * inputPrice + outputTokens * outputPrice) / 1_000_000;
  }
}

interface AnthropicResponse {
  id: string;
  model: string;
  content: {
    type: string;
    text: string;
    id?: string;
    name?: string;
    input?: unknown;
  }[];
  stop_reason: string;
  usage?: { input_tokens: number; output_tokens: number };
}
