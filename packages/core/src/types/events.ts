// ============================================================
// @pgos/core — Event Types
// Type definitions for the PGOS Event System
// ============================================================

export interface GuardianEvent<T = unknown> {
  id: string;
  type: EventType;
  projectId?: string;
  timestamp: Date;
  source: string;
  data: T;
  metadata: EventMetadata;
}

export interface EventMetadata {
  correlationId: string;
  causationId?: string;
  userId?: string;
  sessionId?: string;
  version: number;
}

export type EventType =
  // Project lifecycle
  | 'project.created'
  | 'project.ingested'
  | 'project.updated'
  | 'project.archived'
  // Context
  | 'context.compiled'
  | 'context.exported'
  | 'context.invalidated'
  // Snapshots
  | 'snapshot.created'
  | 'snapshot.restored'
  | 'snapshot.deleted'
  // Validation
  | 'validation.started'
  | 'validation.completed'
  | 'validation.failed'
  // Architecture
  | 'architecture.fingerprinted'
  | 'architecture.drift.detected'
  | 'architecture.violation'
  // Hallucination
  | 'hallucination.detected'
  | 'hallucination.validated'
  // Completion
  | 'completion.scored'
  | 'completion.rejected'
  // Recovery
  | 'recovery.initiated'
  | 'recovery.completed'
  | 'recovery.failed'
  // Sessions
  | 'session.started'
  | 'session.ended'
  | 'session.model.switched'
  // Agents
  | 'agent.task.created'
  | 'agent.task.started'
  | 'agent.task.completed'
  | 'agent.task.failed'
  // Memory
  | 'memory.stored'
  | 'memory.consolidated'
  | 'memory.exported'
  // Policy
  | 'policy.evaluated'
  | 'policy.violated'
  // System
  | 'system.health.checked'
  | 'system.error';

export interface EventSubscription {
  id: string;
  eventTypes: EventType[];
  handler: EventHandler;
  filter?: EventFilter;
}

export type EventHandler<T = unknown> = (event: GuardianEvent<T>) => Promise<void>;

export interface EventFilter {
  projectId?: string;
  source?: string;
  minSeverity?: string;
}

export interface EventBus {
  publish<T>(event: GuardianEvent<T>): Promise<void>;
  subscribe(subscription: EventSubscription): string;
  unsubscribe(subscriptionId: string): void;
}
