// ============================================================
// @pgos/core — Error Types
// Custom error classes for PGOS
// ============================================================

export class GuardianError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;

  constructor(message: string, code: string, statusCode: number = 500, details?: Record<string, unknown>) {
    super(message);
    this.name = 'GuardianError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ProjectNotFoundError extends GuardianError {
  constructor(projectId: string) {
    super(`Project not found: ${projectId}`, 'PROJECT_NOT_FOUND', 404, { projectId });
    this.name = 'ProjectNotFoundError';
  }
}

export class SnapshotNotFoundError extends GuardianError {
  constructor(snapshotId: string) {
    super(`Snapshot not found: ${snapshotId}`, 'SNAPSHOT_NOT_FOUND', 404, { snapshotId });
    this.name = 'SnapshotNotFoundError';
  }
}

export class ValidationError extends GuardianError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

export class ModelConnectionError extends GuardianError {
  constructor(provider: string, message: string) {
    super(`Model connection failed (${provider}): ${message}`, 'MODEL_CONNECTION_ERROR', 502, { provider });
    this.name = 'ModelConnectionError';
  }
}

export class ContextCompilationError extends GuardianError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(`Context compilation failed: ${message}`, 'CONTEXT_COMPILATION_ERROR', 500, details);
    this.name = 'ContextCompilationError';
  }
}

export class RecoveryError extends GuardianError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(`Recovery failed: ${message}`, 'RECOVERY_ERROR', 500, details);
    this.name = 'RecoveryError';
  }
}

export class PolicyViolationError extends GuardianError {
  constructor(policy: string, message: string) {
    super(`Policy violated (${policy}): ${message}`, 'POLICY_VIOLATION', 403, { policy });
    this.name = 'PolicyViolationError';
  }
}

export class ArchitectureViolationError extends GuardianError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(`Architecture violation: ${message}`, 'ARCHITECTURE_VIOLATION', 400, details);
    this.name = 'ArchitectureViolationError';
  }
}

export class HallucinationDetectedError extends GuardianError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(`Hallucination detected: ${message}`, 'HALLUCINATION_DETECTED', 400, details);
    this.name = 'HallucinationDetectedError';
  }
}

export class AuthenticationError extends GuardianError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTHENTICATION_ERROR', 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends GuardianError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 'AUTHORIZATION_ERROR', 403);
    this.name = 'AuthorizationError';
  }
}

export class RateLimitError extends GuardianError {
  constructor(retryAfter: number) {
    super(`Rate limit exceeded. Retry after ${retryAfter}ms`, 'RATE_LIMIT_EXCEEDED', 429, { retryAfter });
    this.name = 'RateLimitError';
  }
}
