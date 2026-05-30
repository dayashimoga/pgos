// ============================================================
// @pgos/model-adapters — Base Adapter
// Abstract base class for all model adapters
// ============================================================

import {
  type ModelAdapter,
  type ModelProvider,
  type ModelConfig,
  type ModelRequest,
  type ModelResponse,
  type ModelMemory,
  type ModelValidation,
  type ModelCapability,
  type ModelLoadOptions,
  type ModelMessage,
  ModelConnectionError,
  componentLogger,
  generateId,
} from '@pgos/core';

const log = componentLogger('model-adapter');

/**
 * Abstract base class for model adapters.
 * All provider-specific adapters extend this.
 */
export abstract class BaseAdapter implements ModelAdapter {
  public readonly provider: ModelProvider;
  public readonly name: string;
  public config: ModelConfig;

  protected context: string = '';
  protected messages: ModelMessage[] = [];
  protected sessionId: string;

  constructor(provider: ModelProvider, name: string, config: ModelConfig) {
    this.provider = provider;
    this.name = name;
    this.config = config;
    this.sessionId = generateId();
  }

  async loadContext(context: string, options?: ModelLoadOptions): Promise<void> {
    this.context = context;
    log.info({ provider: this.provider, model: this.config.model, contextLength: context.length }, 'Context loaded');
  }

  abstract execute(request: ModelRequest): Promise<ModelResponse>;

  async exportMemory(): Promise<ModelMemory> {
    return {
      provider: this.provider,
      model: this.config.model,
      sessionId: this.sessionId,
      messages: [...this.messages],
      context: this.context,
      metadata: {},
      exportedAt: new Date(),
    };
  }

  async importMemory(memory: ModelMemory): Promise<void> {
    this.messages = [...memory.messages];
    this.context = memory.context;
    this.sessionId = memory.sessionId;
    log.info({ provider: this.provider, messages: this.messages.length }, 'Memory imported');
  }

  abstract validate(): Promise<ModelValidation>;

  async countTokens(content: string): Promise<number> {
    // Default estimation — override for precise counting
    return Math.ceil(content.length / 4);
  }

  abstract supports(capability: ModelCapability): boolean;

  /**
   * Build the messages array for a request
   */
  protected buildMessages(request: ModelRequest): ModelMessage[] {
    const messages: ModelMessage[] = [];

    // System prompt with context
    const systemParts: string[] = [];
    if (request.systemPrompt) systemParts.push(request.systemPrompt);
    if (this.context) systemParts.push(`\n\n--- Project Context ---\n${this.context}`);

    if (systemParts.length > 0) {
      messages.push({ role: 'system', content: systemParts.join('\n') });
    }

    // Previous messages from session
    messages.push(...this.messages);

    // New messages from request
    messages.push(...request.messages);

    return messages;
  }

  /**
   * Make an HTTP request to the model API
   */
  protected async httpRequest(url: string, body: unknown, headers: Record<string, string> = {}): Promise<unknown> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeout || 60000);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
          ...this.config.headers,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new ModelConnectionError(
          this.provider,
          `HTTP ${response.status}: ${errorBody.slice(0, 500)}`
        );
      }

      return response.json();
    } catch (error) {
      if (error instanceof ModelConnectionError) throw error;
      const msg = error instanceof Error ? error.message : String(error);
      throw new ModelConnectionError(this.provider, msg);
    } finally {
      clearTimeout(timeout);
    }
  }
}
