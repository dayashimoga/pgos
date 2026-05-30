import { describe, it, expect } from 'vitest';
import { RuleEngine, Enforcer, RBACManager } from '../index.js';
import type { Policy } from '@pgos/core';

describe('PGOS Policy Engine', () => {
  describe('RuleEngine', () => {
    it('should evaluate policies and detect violations', () => {
      const policies: Policy[] = [{
        name: 'Max File Count',
        enabled: true,
        severity: 'error',
        rules: [{
          condition: { type: 'metric', operator: 'less_than', target: 'filesCount', value: 5 },
          description: 'Project should have fewer than 5 critical files changed',
        }],
      }] as any;

      const config = { filesCount: 10 }; // Exceeds limit
      const result = RuleEngine.evaluate(config, policies);

      expect(result.passed).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.violations[0].severity).toBe('error');
    });

    it('should pass when all rules are satisfied', () => {
      const policies: Policy[] = [{
        name: 'Risk Threshold',
        enabled: true,
        severity: 'warning',
        rules: [{
          condition: { type: 'metric', operator: 'less_than', target: 'riskScore', value: 50 },
        }],
      }] as any;

      const config = { riskScore: 10 };
      const result = RuleEngine.evaluate(config, policies);

      expect(result.passed).toBe(true);
      expect(result.violations.length).toBe(0);
    });

    it('should skip disabled policies', () => {
      const policies: Policy[] = [{
        name: 'Disabled Policy',
        enabled: false,
        severity: 'critical',
        rules: [{
          condition: { type: 'metric', operator: 'equals', target: 'status', value: 'blocked' },
        }],
      }] as any;

      const config = { status: 'not-blocked' };
      const result = RuleEngine.evaluate(config, policies);

      expect(result.passed).toBe(true);
      expect(result.violations.length).toBe(0);
    });

    it('should handle contains operator for arrays', () => {
      const policies: Policy[] = [{
        name: 'Required Tags',
        enabled: true,
        severity: 'warning',
        rules: [{
          condition: { type: 'metric', operator: 'contains', target: 'tags', value: 'reviewed' },
        }],
      }] as any;

      const config = { tags: ['tested', 'reviewed'] };
      const result = RuleEngine.evaluate(config, policies);

      expect(result.passed).toBe(true);
    });

    it('should detect missing array elements', () => {
      const policies: Policy[] = [{
        name: 'Required Tags',
        enabled: true,
        severity: 'error',
        rules: [{
          condition: { type: 'metric', operator: 'contains', target: 'tags', value: 'security-reviewed' },
        }],
      }] as any;

      const config = { tags: ['tested'] };
      const result = RuleEngine.evaluate(config, policies);

      expect(result.passed).toBe(false);
    });

    it('should handle equals operator', () => {
      const policies: Policy[] = [{
        name: 'Validation Status',
        enabled: true,
        severity: 'critical',
        rules: [{
          condition: { type: 'metric', operator: 'equals', target: 'validationPassed', value: true },
        }],
      }] as any;

      const passingConfig = { validationPassed: true };
      const failingConfig = { validationPassed: false };

      expect(RuleEngine.evaluate(passingConfig, policies).passed).toBe(true);
      expect(RuleEngine.evaluate(failingConfig, policies).passed).toBe(false);
    });
  });

  describe('Enforcer', () => {
    it('should throw when critical policies are violated', () => {
      const policies: Policy[] = [{
        name: 'Risk Gate',
        enabled: true,
        severity: 'error',
        rules: [{
          condition: { type: 'metric', operator: 'less_than', target: 'riskScore', value: 50 },
          description: 'Risk score must be below 50',
        }],
      }] as any;

      const commit = { riskScore: 80 };
      expect(() => Enforcer.enforceCommit(commit, policies)).toThrow('blocked by Policy Engine');
    });

    it('should not throw when policies pass', () => {
      const policies: Policy[] = [{
        name: 'Risk Gate',
        enabled: true,
        severity: 'warning',
        rules: [{
          condition: { type: 'metric', operator: 'less_than', target: 'riskScore', value: 100 },
        }],
      }] as any;

      const commit = { riskScore: 10 };
      expect(() => Enforcer.enforceCommit(commit, policies)).not.toThrow();
    });
  });

  describe('RBACManager', () => {
    it('should authorize admin for any action', () => {
      expect(RBACManager.authorize('administrator', 'context:compile')).toBe(true);
      expect(RBACManager.authorize('administrator', 'any-action')).toBe(true);
    });

    it('should authorize agent for allowed actions', () => {
      expect(RBACManager.authorize('agent', 'context:compile')).toBe(true);
      expect(RBACManager.authorize('agent', 'snapshot:create')).toBe(true);
      expect(RBACManager.authorize('agent', 'validation:run')).toBe(true);
    });

    it('should deny agent for unauthorized actions', () => {
      expect(RBACManager.authorize('agent', 'admin:delete-all')).toBe(false);
    });

    it('should deny viewer for write actions', () => {
      expect(RBACManager.authorize('viewer', 'git:commit')).toBe(false);
      expect(RBACManager.authorize('viewer', 'snapshot:create')).toBe(false);
    });

    it('should allow viewer for read actions', () => {
      expect(RBACManager.authorize('viewer', 'context:read')).toBe(true);
      expect(RBACManager.authorize('viewer', 'memory:query')).toBe(true);
    });

    it('should deny unknown roles', () => {
      expect(RBACManager.authorize('unknown-role', 'context:read')).toBe(false);
    });

    it('should be case-insensitive for role names', () => {
      expect(RBACManager.authorize('Administrator', 'any-action')).toBe(true);
      expect(RBACManager.authorize('AGENT', 'context:compile')).toBe(true);
    });
  });
});
