// ============================================================
// @pgos/policy-engine — Entry Point
// Compliance, policy enforcement, and role-based access control
// ============================================================

import { componentLogger, type Policy, type PolicyRule } from '@pgos/core';

const log = componentLogger('policy-engine');

export interface PolicyValidationResult {
  passed: boolean;
  violations: {
    ruleName: string;
    message: string;
    severity: 'info' | 'warning' | 'error' | 'critical';
  }[];
}

export interface UserRole {
  name: string;
  permissions: string[];
}

/**
 * Rule Engine that scans and evaluates policy structures
 */
export class RuleEngine {
  /**
   * Evaluate a specific project configuration against dynamic policy definitions
   */
  static evaluate(projectConfig: any, policies: Policy[]): PolicyValidationResult {
    log.info({ policiesCount: policies.length }, 'Evaluating compliance policies');

    const violations: PolicyValidationResult['violations'] = [];

    for (const policy of policies) {
      if (!policy.enabled) continue;

      for (const rule of policy.rules) {
        const passed = this.checkRule(projectConfig, rule);
        if (!passed) {
          violations.push({
            ruleName: policy.name,
            message: rule.description || `Rule validation failed: ${rule.condition.type}`,
            severity: policy.severity || 'warning',
          });
        }
      }
    }

    const passed = !violations.some((v) => v.severity === 'error' || v.severity === 'critical');

    return {
      passed,
      violations,
    };
  }

  private static checkRule(config: any, rule: PolicyRule): boolean {
    const targetField = rule.condition.target || '';
    const value = config[targetField];

    switch (rule.condition.operator) {
      case 'equals':
        return value === rule.condition.value;
      case 'contains':
        return Array.isArray(value) && value.includes(rule.condition.value);
      case 'greater_than':
        return typeof value === 'number' && value > (rule.condition.value as number);
      case 'less_than':
        return typeof value === 'number' && value < (rule.condition.value as number);
      default:
        return true;
    }
  }
}

/**
 * Enforcer to halt autonomous actions if policy validation is critically violated
 */
export class Enforcer {
  /**
   * Enforces code or commit operations. Throws if critical rules fail.
   */
  static enforceCommit(semanticCommit: any, policies: Policy[]): void {
    log.info('Enforcing policy policies on semantic commit');

    const mockConfig = {
      riskScore: semanticCommit.riskScore || 0,
      filesCount: Array.isArray(semanticCommit.impactAreas) ? semanticCommit.impactAreas.length : 0,
      validationPassed: semanticCommit.validated || false,
    };

    const result = RuleEngine.evaluate(mockConfig, policies);

    if (!result.passed) {
      const blockages = result.violations
        .filter((v) => v.severity === 'error' || v.severity === 'critical')
        .map((v) => v.message)
        .join(', ');

      log.error({ blockages }, 'Policy check failed. Operation blocked.');
      throw new Error(`Commit operation blocked by Policy Engine: [${blockages}]`);
    }

    log.info('Policy checks passed successfully');
  }
}

/**
 * RBAC authorization manager for multi-agent vibe coding security
 */
export class RBACManager {
  private static roles: Map<string, UserRole> = new Map([
    [
      'administrator',
      {
        name: 'administrator',
        permissions: ['*'],
      },
    ],
    [
      'agent',
      {
        name: 'agent',
        permissions: [
          'context:compile',
          'snapshot:create',
          'validation:run',
          'git:commit',
          'memory:query',
          'memory:store',
        ],
      },
    ],
    [
      'viewer',
      {
        name: 'viewer',
        permissions: [
          'context:read',
          'snapshot:list',
          'validation:read',
          'memory:query',
        ],
      },
    ],
  ]);

  /**
   * Authorizes a role to perform an action
   */
  static authorize(roleName: string, permission: string): boolean {
    const role = this.roles.get(roleName.toLowerCase());
    if (!role) return false;

    if (role.permissions.includes('*')) return true;
    return role.permissions.includes(permission);
  }
}
