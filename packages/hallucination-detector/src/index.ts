// ============================================================
// @pgos/hallucination-detector — Entry Point
// Detect hallucinated code, fake dependencies, and invalid APIs
// ============================================================

import { readFile } from 'fs/promises';
import { join } from 'path';
import {
  type HallucinationResult,
  type HallucinationIssue,
  type HallucinationType,
  listFilesRecursive,
  isBinaryFile,
  fileExists,
  componentLogger,
} from '@pgos/core';

const log = componentLogger('hallucination-detector');

/**
 * Scan project for hallucinated code
 */
export async function detectHallucinations(rootPath: string): Promise<HallucinationResult> {
  log.info({ rootPath }, 'Scanning for hallucinations');

  const files = await listFilesRecursive(rootPath);
  const sourceFiles = files.filter((f) => !isBinaryFile(f));
  const issues: HallucinationIssue[] = [];

  // Load package manifest for validation
  const installedPackages = await getInstalledPackages(rootPath);

  for (const filePath of sourceFiles.slice(0, 500)) {
    try {
      const content = await readFile(filePath, 'utf-8');
      const lines = content.split('\n');

      // Check imports against installed packages
      const importIssues = checkImports(filePath, content, lines, installedPackages);
      issues.push(...importIssues);

      // Check for suspicious API patterns
      const apiIssues = checkSuspiciousAPIs(filePath, content, lines);
      issues.push(...apiIssues);

    } catch {
      // Skip unreadable files
    }
  }

  const total = sourceFiles.length;
  const validated = total - issues.length;
  const score = total > 0 ? Math.round((validated / total) * 100) : 100;

  log.info({ score, issues: issues.length, filesScanned: total }, 'Hallucination scan complete');

  return { score, issues, validated, total };
}

/**
 * Check imports against installed packages
 */
function checkImports(
  filePath: string,
  content: string,
  lines: string[],
  installed: Set<string>
): HallucinationIssue[] {
  const issues: HallucinationIssue[] = [];

  // Node.js/TypeScript imports
  const importRegex = /(?:import(?:[\s\S]*?from)?|require)\s*\(?['"]([^'"./][^'"]*)['"]\)?/g;
  let match: RegExpExecArray | null;

  while ((match = importRegex.exec(content)) !== null) {
    const pkg = match[1]!.split('/')[0]!;
    // Skip Node.js builtins
    if (isNodeBuiltin(pkg)) continue;
    // Skip workspace packages
    if (pkg.startsWith('@pgos/')) continue;

    if (installed.size > 0 && !installed.has(pkg) && !installed.has(match[1]!)) {
      const lineNum = content.slice(0, match.index).split('\n').length;
      issues.push({
        type: 'hallucinated_dependency',
        file: filePath,
        line: lineNum,
        content: lines[lineNum - 1]?.trim() || '',
        confidence: 0.8,
        explanation: `Package "${pkg}" is imported but not found in package.json`,
        suggestion: `Run: npm install ${pkg} — or remove the import if it's not needed`,
      });
    }
  }

  return issues;
}

/**
 * Check for suspicious API usage patterns
 */
function checkSuspiciousAPIs(
  filePath: string,
  content: string,
  lines: string[]
): HallucinationIssue[] {
  const issues: HallucinationIssue[] = [];

  // Common hallucinated patterns
  const suspiciousPatterns = [
    { pattern: /\.fetchAll\(\)/g, type: 'unsupported_method' as HallucinationType, msg: 'fetchAll() is not a standard API' },
    { pattern: /process\.env\.get\(/g, type: 'nonexistent_api' as HallucinationType, msg: 'process.env.get() does not exist; use process.env.KEY' },
    { pattern: /JSON\.tryParse\(/g, type: 'nonexistent_api' as HallucinationType, msg: 'JSON.tryParse() does not exist' },
    { pattern: /Array\.flatten\(/g, type: 'nonexistent_api' as HallucinationType, msg: 'Use Array.flat() instead' },
    { pattern: /String\.contains\(/g, type: 'nonexistent_api' as HallucinationType, msg: 'Use String.includes() instead' },
    { pattern: /console\.success\(/g, type: 'nonexistent_api' as HallucinationType, msg: 'console.success() does not exist' },
    { pattern: /fs\.readFileAsync\(/g, type: 'nonexistent_api' as HallucinationType, msg: 'Use fs.promises.readFile() instead' },
  ];

  for (const { pattern, type, msg } of suspiciousPatterns) {
    let match: RegExpExecArray | null;
    const re = new RegExp(pattern.source, pattern.flags);

    while ((match = re.exec(content)) !== null) {
      const lineNum = content.slice(0, match.index).split('\n').length;
      issues.push({
        type,
        file: filePath,
        line: lineNum,
        content: lines[lineNum - 1]?.trim() || '',
        confidence: 0.9,
        explanation: msg,
        suggestion: 'Verify this API exists in the target runtime',
      });
    }
  }

  return issues;
}

/**
 * Get installed packages from package.json
 */
async function getInstalledPackages(rootPath: string): Promise<Set<string>> {
  const pkgPath = join(rootPath, 'package.json');
  const packages = new Set<string>();

  if (await fileExists(pkgPath)) {
    try {
      const content = await readFile(pkgPath, 'utf-8');
      const pkg = JSON.parse(content);

      for (const deps of [pkg.dependencies, pkg.devDependencies, pkg.peerDependencies]) {
        if (deps) {
          for (const name of Object.keys(deps)) {
            packages.add(name);
            // Also add scope for scoped packages
            if (name.startsWith('@')) {
              packages.add(name.split('/')[0]!);
            }
          }
        }
      }
    } catch {
      // Unable to parse
    }
  }

  return packages;
}

/**
 * Check if a module name is a Node.js builtin
 */
function isNodeBuiltin(name: string): boolean {
  const builtins = new Set([
    'assert', 'buffer', 'child_process', 'cluster', 'console', 'constants', 'crypto',
    'dgram', 'dns', 'domain', 'events', 'fs', 'http', 'https', 'module', 'net', 'os',
    'path', 'perf_hooks', 'process', 'punycode', 'querystring', 'readline', 'repl',
    'stream', 'string_decoder', 'sys', 'timers', 'tls', 'tty', 'url', 'util', 'v8',
    'vm', 'worker_threads', 'zlib', 'node',
  ]);
  return builtins.has(name) || name.startsWith('node:');
}
