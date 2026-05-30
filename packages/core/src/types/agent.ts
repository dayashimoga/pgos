// ============================================================
// @pgos/core — Agent Types
// Type definitions for the Agent Orchestration Runtime
// ============================================================

export interface Agent {
  id: string;
  type: AgentType;
  name: string;
  description: string;
  capabilities: string[];
  modelPreference?: string;
  config: AgentConfig;
}

export type AgentType =
  | 'architect'
  | 'planner'
  | 'coder'
  | 'reviewer'
  | 'security'
  | 'qa'
  | 'performance'
  | 'recovery'
  | 'validator'
  | 'docs'
  | 'custom';

export interface AgentConfig {
  maxRetries: number;
  timeout: number;
  temperature: number;
  maxTokens: number;
  tools: string[];
  systemPrompt?: string;
}

export interface AgentTask {
  id: string;
  projectId: string;
  agentType: AgentType;
  parentTaskId?: string;
  description: string;
  input: AgentTaskInput;
  output?: AgentTaskOutput;
  status: AgentTaskStatus;
  assignedModel?: string;
  tokensUsed: number;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
}

export type AgentTaskStatus =
  | 'pending'
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'blocked';

export interface AgentTaskInput {
  context: string;
  instructions: string;
  files?: string[];
  constraints?: string[];
  previousResults?: Record<string, unknown>;
}

export interface AgentTaskOutput {
  result: string;
  files?: AgentFileChange[];
  suggestions?: string[];
  warnings?: string[];
  metrics?: Record<string, number>;
}

export interface AgentFileChange {
  path: string;
  action: 'create' | 'modify' | 'delete';
  content?: string;
  diff?: string;
}

export interface AgentPipeline {
  id: string;
  projectId: string;
  name: string;
  stages: AgentStage[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  createdAt: Date;
}

export interface AgentStage {
  order: number;
  agentType: AgentType;
  taskDescription: string;
  dependsOn?: number[];
  parallel?: boolean;
}

export interface AgentMemory {
  agentId: string;
  projectId: string;
  shortTerm: Record<string, unknown>;
  longTerm: Record<string, unknown>;
  sharedWith: string[];
}
