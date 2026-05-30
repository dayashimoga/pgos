// ============================================================
// @pgos/core — Constants
// System-wide constants
// ============================================================

/** PGOS version */
export const VERSION = '0.1.0';

/** Guardian directory name (in project root) */
export const GUARDIAN_DIR = '.guardian';

/** Guardian subdirectories */
export const GUARDIAN_DIRS = {
  context: `${GUARDIAN_DIR}/context`,
  snapshots: `${GUARDIAN_DIR}/snapshots`,
  memory: `${GUARDIAN_DIR}/memory`,
  validation: `${GUARDIAN_DIR}/validation`,
  policies: `${GUARDIAN_DIR}/policies`,
  architecture: `${GUARDIAN_DIR}/architecture`,
  recovery: `${GUARDIAN_DIR}/recovery`,
  knowledge: `${GUARDIAN_DIR}/knowledge`,
  decisions: `${GUARDIAN_DIR}/decisions`,
  telemetry: `${GUARDIAN_DIR}/telemetry`,
} as const;

/** Default token limits per context level */
export const DEFAULT_TOKEN_LIMITS = {
  L0: 5000,  // Global architecture
  L1: 10000, // Active modules
  L2: 15000, // Task scope
  L3: 5000,  // Recent edits
  L4: 5000,  // History
  total: 40000,
} as const;

/** Default model configurations */
export const DEFAULT_MODEL_CONFIG = {
  temperature: 0.7,
  maxTokens: 4096,
  timeout: 60000,
  retries: 3,
} as const;

/** Anti-pattern detection patterns */
export const ANTI_PATTERNS = {
  todo: /\bTODO\b/gi,
  fixme: /\bFIXME\b/gi,
  hack: /\bHACK\b/gi,
  not_implemented: /\bNotImplemented(?:Error)?\b/g,
  throw_not_implemented: /throw\s+new\s+(?:NotImplementedError|Error\s*\(\s*['"]not\s+implemented)/gi,
  pass_statement: /^\s*pass\s*$/gm,
  empty_function: /\{\s*\}/g,
  placeholder: /placeholder|lorem ipsum|sample|example\.com/gi,
  hardcoded: /(?:password|secret|key|token)\s*[:=]\s*['"][^'"]+['"]/gi,
  mock_logic: /\bmock\b.*\breturn\b/gi,
  stub: /\bstub\b/gi,
  commented_code: /^\s*\/\/\s*[a-zA-Z_$][a-zA-Z0-9_$]*\s*\(|^\s*#\s*[a-z_]+\s*\(/gm,
} as const;

/** Default snapshot configuration */
export const DEFAULT_SNAPSHOT_CONFIG = {
  autoSnapshot: true,
  retentionDays: 30,
  maxSnapshots: 100,
  compressSnapshots: true,
} as const;

/** Supported languages for AST parsing */
export const SUPPORTED_LANGUAGES = [
  'typescript',
  'javascript',
  'python',
  'go',
  'rust',
  'java',
  'csharp',
  'ruby',
  'php',
  'kotlin',
  'swift',
  'scala',
] as const;

/** API version */
export const API_VERSION = 'v1';

/** Default API port */
export const DEFAULT_API_PORT = 3001;

/** Default dashboard port */
export const DEFAULT_DASHBOARD_PORT = 3000;

/** Maximum file size for processing (10MB) */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/** Maximum files per project for ingestion */
export const MAX_FILES_PER_PROJECT = 50000;
