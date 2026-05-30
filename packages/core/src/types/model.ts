// ============================================================
// @pgos/core — Model Types
// Type definitions for the Model Portability Layer
// ============================================================

export interface ModelAdapter {
  provider: ModelProvider;
  name: string;
  config: ModelConfig;

  /** Load context into the model */
  loadContext(context: string, options?: ModelLoadOptions): Promise<void>;

  /** Execute a prompt/completion */
  execute(request: ModelRequest): Promise<ModelResponse>;

  /** Export current session memory */
  exportMemory(): Promise<ModelMemory>;

  /** Import session memory */
  importMemory(memory: ModelMemory): Promise<void>;

  /** Validate the model connection */
  validate(): Promise<ModelValidation>;

  /** Get token count for content */
  countTokens(content: string): Promise<number>;

  /** Check if the model supports a capability */
  supports(capability: ModelCapability): boolean;
}

export type ModelProvider =
  | 'openai'
  | 'anthropic'
  | 'gemini'
  | 'ollama'
  | 'vllm'
  | 'lmstudio'
  | 'custom';

export interface ModelConfig {
  provider: ModelProvider;
  model: string;
  apiKey?: string;
  baseUrl?: string;
  maxTokens: number;
  temperature: number;
  topP?: number;
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
  options?: Record<string, unknown>;
}

export interface ModelRequest {
  messages: ModelMessage[];
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  tools?: ModelTool[];
  responseFormat?: 'text' | 'json';
  stream?: boolean;
}

export interface ModelMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  toolCallId?: string;
}

export interface ModelTool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface ModelResponse {
  content: string;
  tokensInput: number;
  tokensOutput: number;
  model: string;
  provider: ModelProvider;
  finishReason: 'stop' | 'length' | 'tool_calls' | 'error';
  toolCalls?: ModelToolCall[];
  cost?: number;
  latencyMs: number;
}

export interface ModelToolCall {
  id: string;
  name: string;
  arguments: string;
}

export interface ModelMemory {
  provider: ModelProvider;
  model: string;
  sessionId: string;
  messages: ModelMessage[];
  context: string;
  metadata: Record<string, unknown>;
  exportedAt: Date;
}

export interface ModelValidation {
  connected: boolean;
  modelAvailable: boolean;
  capabilities: ModelCapability[];
  maxContextWindow: number;
  error?: string;
}

export type ModelCapability =
  | 'chat'
  | 'completion'
  | 'embedding'
  | 'function_calling'
  | 'vision'
  | 'streaming'
  | 'json_mode';

export interface ModelLoadOptions {
  level?: string;
  maxTokens?: number;
  compress?: boolean;
}

export interface ModelSession {
  id: string;
  projectId: string;
  provider: ModelProvider;
  model: string;
  contextPackageId?: string;
  snapshotId?: string;
  tokensInput: number;
  tokensOutput: number;
  tokensSaved: number;
  costUsd: number;
  status: 'active' | 'paused' | 'ended' | 'error';
  metadata: Record<string, unknown>;
  startedAt: Date;
  endedAt?: Date;
}

export interface ConsensusRequest {
  models: ModelConfig[];
  request: ModelRequest;
  strategy: ConsensusStrategy;
  minAgreement?: number;
}

export type ConsensusStrategy = 'majority' | 'unanimous' | 'weighted' | 'best-of-n';

export interface ConsensusResult {
  verdict: 'accept' | 'reject' | 'partial';
  responses: ModelResponse[];
  agreement: number;
  winner?: number;
  analysis: string;
  conflicts: ConsensusConflict[];
}

export interface ConsensusConflict {
  aspect: string;
  positions: { model: string; position: string }[];
  severity: 'minor' | 'major' | 'critical';
}
