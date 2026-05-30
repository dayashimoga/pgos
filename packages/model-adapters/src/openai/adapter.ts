// ============================================================
// @pgos/model-adapters — OpenAI Adapter
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

const log = componentLogger('openai-adapter');

export class OpenAIAdapter extends BaseAdapter {
  private baseUrl: string;

  constructor(config: ModelConfig) {
    super('openai', 'OpenAI', config);
    this.baseUrl = config.baseUrl || 'https://api.openai.com/v1';
  }

  async execute(request: ModelRequest): Promise<ModelResponse> {
    const startTime = Date.now();
    const messages = this.buildMessages(request);

    const body: Record<string, unknown> = {
      model: this.config.model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      max_tokens: request.maxTokens || this.config.maxTokens,
      temperature: request.temperature ?? this.config.temperature,
    };

    if (request.responseFormat === 'json') {
      body.response_format = { type: 'json_object' };
    }

    if (request.tools && request.tools.length > 0) {
      body.tools = request.tools.map((t) => ({
        type: 'function',
        function: { name: t.name, description: t.description, parameters: t.parameters },
      }));
    }

    const response = await this.httpRequest(`${this.baseUrl}/chat/completions`, body, {
      Authorization: `Bearer ${this.config.apiKey}`,
    }) as OpenAIChatResponse;

    const choice = response.choices[0]!;
    const latencyMs = Date.now() - startTime;

    // Store messages for session continuity
    for (const msg of request.messages) {
      this.messages.push(msg);
    }
    this.messages.push({ role: 'assistant', content: choice.message.content || '' });

    log.debug({
      model: this.config.model,
      tokensIn: response.usage?.prompt_tokens,
      tokensOut: response.usage?.completion_tokens,
      latencyMs,
    }, 'OpenAI execution complete');

    return {
      content: choice.message.content || '',
      tokensInput: response.usage?.prompt_tokens || 0,
      tokensOutput: response.usage?.completion_tokens || 0,
      model: response.model,
      provider: 'openai',
      finishReason: choice.finish_reason === 'stop' ? 'stop' : choice.finish_reason === 'length' ? 'length' : 'stop',
      toolCalls: choice.message.tool_calls?.map((tc) => ({
        id: tc.id,
        name: tc.function.name,
        arguments: tc.function.arguments,
      })),
      cost: this.estimateCost(response.usage?.prompt_tokens || 0, response.usage?.completion_tokens || 0),
      latencyMs,
    };
  }

  async validate(): Promise<ModelValidation> {
    try {
      const response = await this.httpRequest(`${this.baseUrl}/models`, null, {
        Authorization: `Bearer ${this.config.apiKey}`,
      }) as { data: { id: string }[] };

      const modelExists = response.data?.some((m) => m.id === this.config.model);

      return {
        connected: true,
        modelAvailable: !!modelExists,
        capabilities: ['chat', 'completion', 'function_calling', 'json_mode', 'streaming'],
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
    const supported: ModelCapability[] = ['chat', 'completion', 'function_calling', 'json_mode', 'streaming'];
    if (this.config.model.includes('embedding')) supported.push('embedding');
    if (this.config.model.includes('vision') || this.config.model.includes('4o')) supported.push('vision');
    return supported.includes(capability);
  }

  private getContextWindow(): number {
    const model = this.config.model;
    if (model.includes('gpt-4o')) return 128000;
    if (model.includes('gpt-4-turbo')) return 128000;
    if (model.includes('gpt-4')) return 8192;
    if (model.includes('gpt-3.5')) return 16385;
    return 8192;
  }

  private estimateCost(inputTokens: number, outputTokens: number): number {
    // Approximate pricing (USD per 1M tokens)
    const model = this.config.model;
    let inputPrice = 5.0;
    let outputPrice = 15.0;

    if (model.includes('gpt-4o-mini')) { inputPrice = 0.15; outputPrice = 0.6; }
    else if (model.includes('gpt-4o')) { inputPrice = 2.5; outputPrice = 10.0; }
    else if (model.includes('gpt-4-turbo')) { inputPrice = 10.0; outputPrice = 30.0; }
    else if (model.includes('gpt-3.5')) { inputPrice = 0.5; outputPrice = 1.5; }

    return (inputTokens * inputPrice + outputTokens * outputPrice) / 1_000_000;
  }
}

interface OpenAIChatResponse {
  id: string;
  model: string;
  choices: {
    message: {
      role: string;
      content: string | null;
      tool_calls?: { id: string; function: { name: string; arguments: string } }[];
    };
    finish_reason: string;
  }[];
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}
