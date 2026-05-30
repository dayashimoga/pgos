// ============================================================
// @pgos/context-engine — Event Intelligence Engine
// Identifies publishers, consumers, listeners, and streams
// mapping asynchronous event paths and pub/sub flows.
// ============================================================

import { ParsedFile } from '../parser/ast-parser.js';

export interface EventPublisher {
  event: string;
  sourceFile: string;
  line: number;
}

export interface EventSubscriber {
  event: string;
  sourceFile: string;
  line: number;
}

export interface EventFlowReport {
  publishers: EventPublisher[];
  subscribers: EventSubscriber[];
  anomalies: { type: 'dead-event' | 'orphan-listener' | 'event-storm'; description: string }[];
}

/**
 * Builds the event flow layout based on AST parsed structures.
 */
export function extractEventIntelligence(
  rootPath: string,
  files: ParsedFile[]
): EventFlowReport {
  const publishers: EventPublisher[] = [];
  const subscribers: EventSubscriber[] = [];
  const anomalies: EventFlowReport['anomalies'] = [];

  for (const f of files) {
    // Collect published events
    for (const e of f.events.emits) {
      publishers.push({
        event: e,
        sourceFile: f.path,
        line: 1, // Fallback base line
      });
    }

    // Collect subscribed events
    for (const l of f.events.listens) {
      subscribers.push({
        event: l,
        sourceFile: f.path,
        line: 1,
      });
    }
  }

  // Cross-reference to find dead events or orphan listeners
  const publishedEvents = new Set(publishers.map(p => p.event));
  const subscribedEvents = new Set(subscribers.map(s => s.event));

  for (const p of publishers) {
    if (!subscribedEvents.has(p.event)) {
      anomalies.push({
        type: 'dead-event',
        description: `Event "${p.event}" is published in ${p.sourceFile} but has no active consumers.`,
      });
    }
  }

  for (const s of subscribers) {
    if (!publishedEvents.has(s.event)) {
      anomalies.push({
        type: 'orphan-listener',
        description: `Event listener for "${s.event}" in ${s.sourceFile} has no active publishers.`,
      });
    }
  }

  return {
    publishers,
    subscribers,
    anomalies,
  };
}
