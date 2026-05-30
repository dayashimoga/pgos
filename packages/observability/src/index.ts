// ============================================================
// @pgos/observability — Entry Point
// Metrics collection, telemetry, and alerting
// ============================================================

import { componentLogger, type GuardianEvent } from '@pgos/core';

const log = componentLogger('observability');

export interface Metric {
  name: string;
  value: number;
  type: 'gauge' | 'counter' | 'histogram';
  labels: Record<string, string>;
  timestamp: Date;
}

export interface Alert {
  id: string;
  name: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  condition: string;
  message: string;
  triggered: boolean;
  triggeredAt?: Date;
}

export interface ProjectMetrics {
  projectId: string;
  completionScore: number;
  hallucinationScore: number;
  tokenReduction: number;
  testCoverage: number;
  healthScore: number;
  architectureDrift: number;
  recoveryEvents: number;
  aiQuality: number;
  totalCost: number;
  avgLatency: number;
  timestamp: Date;
}

class MetricsCollector {
  private metrics: Metric[] = [];
  private alerts: Alert[] = [];
  private projectMetrics: Map<string, ProjectMetrics> = new Map();

  record(name: string, value: number, type: Metric['type'] = 'gauge', labels: Record<string, string> = {}): void {
    this.metrics.push({ name, value, type, labels, timestamp: new Date() });
    log.debug({ name, value, type }, 'Metric recorded');
  }

  increment(name: string, labels: Record<string, string> = {}): void {
    this.record(name, 1, 'counter', labels);
  }

  getMetrics(name?: string): Metric[] {
    if (name) return this.metrics.filter((m) => m.name === name);
    return [...this.metrics];
  }

  updateProjectMetrics(projectId: string, updates: Partial<ProjectMetrics>): void {
    const existing = this.projectMetrics.get(projectId) || {
      projectId,
      completionScore: 0,
      hallucinationScore: 0,
      tokenReduction: 0,
      testCoverage: 0,
      healthScore: 0,
      architectureDrift: 0,
      recoveryEvents: 0,
      aiQuality: 0,
      totalCost: 0,
      avgLatency: 0,
      timestamp: new Date(),
    };

    this.projectMetrics.set(projectId, { ...existing, ...updates, timestamp: new Date() });
  }

  getProjectMetrics(projectId: string): ProjectMetrics | undefined {
    return this.projectMetrics.get(projectId);
  }

  addAlert(alert: Alert): void {
    this.alerts.push(alert);
  }

  getAlerts(severity?: Alert['severity']): Alert[] {
    if (severity) return this.alerts.filter((a) => a.severity === severity);
    return [...this.alerts];
  }

  processEvent(event: GuardianEvent): void {
    this.increment(`events.${event.type}`, { projectId: event.projectId || '' });
  }

  reset(): void {
    this.metrics = [];
  }
}

// Singleton collector
export const metricsCollector = new MetricsCollector();

export { MetricsCollector };
