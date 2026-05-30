// ============================================================
// @pgos/test-engine — Entry Point
// AI-native test generation, coverage analysis, and intent parsing
// ============================================================

import { readFile } from 'fs/promises';
import { join, basename, dirname, extname } from 'path';
import { componentLogger, fileExists, listFilesRecursive, isBinaryFile } from '@pgos/core';

const log = componentLogger('test-engine');

export interface TestIntent {
  featureName: string;
  sourceFile: string;
  assertions: {
    description: string;
    expectedBehavior: string;
    targetMethod: string;
    targetParams: string[];
    returnType: string;
    isAsync: boolean;
  }[];
  mockRequirements: string[];
  imports: string[];
}

export interface GeneratedTestFile {
  fileName: string;
  filePath: string;
  code: string;
}

export interface CoverageReport {
  overallCoverage: number;
  coveredLines: number;
  totalLines: number;
  uncoveredFiles: {
    filePath: string;
    uncoveredLines: number[];
    percentage: number;
  }[];
}

/**
 * Parser that extracts test intentions by reading the actual source file
 */
export class IntentParser {
  /**
   * Parse a source file to extract real function signatures, classes, and exports
   * for generating meaningful test intentions.
   */
  static async parseIntent(sourceFilePath: string, requirement?: string): Promise<TestIntent> {
    log.info({ sourceFilePath, requirement }, 'Parsing test intent from source file');

    let content: string;
    try {
      content = await readFile(sourceFilePath, 'utf-8');
    } catch {
      // Fallback to keyword-based intent when source file isn't available
      return this.parseIntentFromRequirement(requirement || 'generic feature', sourceFilePath);
    }

    const featureName = basename(sourceFilePath, extname(sourceFilePath));
    const assertions: TestIntent['assertions'] = [];
    const mockRequirements: string[] = [];
    const imports: string[] = [];

    // Extract exported functions with their signatures
    const funcRegex = /export\s+(async\s+)?function\s+(\w+)\s*\(([^)]*)\)(?:\s*:\s*([^\n{]+))?/g;
    let match: RegExpExecArray | null;

    while ((match = funcRegex.exec(content)) !== null) {
      const isAsync = !!match[1];
      const name = match[2]!;
      const paramsRaw = match[3] || '';
      const returnType = match[4]?.trim() || (isAsync ? 'Promise<void>' : 'void');
      const params = paramsRaw
        .split(',')
        .map((p) => p.trim().split(':')[0]!.trim())
        .filter(Boolean);

      // Generate meaningful assertions based on return type
      assertions.push({
        description: `should return valid result when calling ${name} with valid parameters`,
        expectedBehavior: `returns a ${returnType} value without throwing`,
        targetMethod: name,
        targetParams: params,
        returnType,
        isAsync,
      });

      // Add edge case assertion
      if (params.length > 0) {
        assertions.push({
          description: `should handle edge cases gracefully in ${name}`,
          expectedBehavior: `handles null/empty/boundary inputs without crashing`,
          targetMethod: name,
          targetParams: params,
          returnType,
          isAsync,
        });
      }
    }

    // Extract exported classes and their methods
    const classRegex = /export\s+class\s+(\w+)(?:\s+extends\s+(\w+))?/g;
    while ((match = classRegex.exec(content)) !== null) {
      const className = match[1]!;
      imports.push(className);

      // Find static methods
      const staticMethodRegex = new RegExp(
        `static\\s+(async\\s+)?(\\w+)\\s*\\(([^)]*)\\)(?:\\s*:\\s*([^\\n{]+))?`,
        'g'
      );
      let methodMatch: RegExpExecArray | null;
      while ((methodMatch = staticMethodRegex.exec(content)) !== null) {
        const isAsync = !!methodMatch[1];
        const methodName = methodMatch[2]!;
        const methodParams = methodMatch[3] || '';
        const retType = methodMatch[4]?.trim() || 'void';
        const params = methodParams
          .split(',')
          .map((p) => p.trim().split(':')[0]!.trim())
          .filter(Boolean);

        assertions.push({
          description: `should correctly execute ${className}.${methodName}`,
          expectedBehavior: `${className}.${methodName}() returns expected ${retType}`,
          targetMethod: `${className}.${methodName}`,
          targetParams: params,
          returnType: retType,
          isAsync,
        });
      }
    }

    // Detect mock requirements from import patterns
    const importMatches = content.matchAll(/import\s+.*from\s+['"]([^'"]+)['"]/g);
    for (const imp of importMatches) {
      const source = imp[1]!;
      if (/db|database|postgres|sql|drizzle|prisma/i.test(source)) mockRequirements.push('database');
      if (/redis|cache|memcached/i.test(source)) mockRequirements.push('redis');
      if (/fetch|axios|http|got|request/i.test(source)) mockRequirements.push('network');
      if (/fs|path|file/i.test(source) && !source.startsWith('.')) mockRequirements.push('filesystem');
    }

    // Extract exported variable names for import generation
    const varExportRegex = /export\s+(?:const|let|var)\s+(\w+)/g;
    while ((match = varExportRegex.exec(content)) !== null) {
      imports.push(match[1]!);
    }

    // Add function names to imports
    const funcExportRegex = /export\s+(?:async\s+)?function\s+(\w+)/g;
    while ((match = funcExportRegex.exec(content)) !== null) {
      imports.push(match[1]!);
    }

    return {
      featureName,
      sourceFile: sourceFilePath,
      assertions,
      mockRequirements: [...new Set(mockRequirements)],
      imports: [...new Set(imports)],
    };
  }

  /**
   * Fallback: parse from natural language requirement when source file is unavailable
   */
  private static parseIntentFromRequirement(requirement: string, sourceFile: string): TestIntent {
    const featureMatch = requirement.match(/(?:for|implement|add|create)\s+([a-zA-Z0-9_\-\s]+)/i);
    const featureName = featureMatch ? featureMatch[1].trim() : 'Feature';

    const assertions: TestIntent['assertions'] = [];
    const mockRequirements: string[] = [];

    // Extract action verbs for assertion generation
    const actionVerbs = requirement.match(/\b(validate|compute|generate|parse|create|update|delete|fetch|transform|render)\b/gi) || [];
    for (const verb of actionVerbs) {
      assertions.push({
        description: `should ${verb.toLowerCase()} correctly with valid input`,
        expectedBehavior: `completes ${verb.toLowerCase()} operation successfully`,
        targetMethod: verb.toLowerCase(),
        targetParams: ['input'],
        returnType: 'unknown',
        isAsync: true,
      });
    }

    // Default assertion if none extracted
    if (assertions.length === 0) {
      assertions.push({
        description: `should execute ${featureName} core flow correctly`,
        expectedBehavior: 'resolves successfully with expected output',
        targetMethod: 'execute',
        targetParams: ['params'],
        returnType: 'unknown',
        isAsync: true,
      });
      assertions.push({
        description: `should handle invalid input gracefully in ${featureName}`,
        expectedBehavior: 'throws or returns error for invalid input',
        targetMethod: 'execute',
        targetParams: [],
        returnType: 'unknown',
        isAsync: true,
      });
    }

    if (/db|database|postgres|sql/i.test(requirement)) mockRequirements.push('database');
    if (/redis|cache/i.test(requirement)) mockRequirements.push('redis');
    if (/api|http|fetch/i.test(requirement)) mockRequirements.push('network');

    return {
      featureName,
      sourceFile,
      assertions,
      mockRequirements,
      imports: [],
    };
  }
}

/**
 * Generates real, runnable TypeScript test files with actual assertions
 */
export class TestGenerator {
  /**
   * Generate a test file with real imports, real function calls, and real assertions
   */
  static generateTests(intent: TestIntent, sourceCodePath: string): GeneratedTestFile {
    log.info({ feature: intent.featureName, sourceCodePath, assertionCount: intent.assertions.length }, 'Generating unit tests');

    const cleanFeatureName = intent.featureName.replace(/[^a-zA-Z0-9]/g, '');

    // Build relative import path from the test file to the source file
    const relativeImport = sourceCodePath.replace(/\\/g, '/').replace(/\.(ts|js)$/, '.js');

    // Build real import statement
    const importNames = intent.imports.length > 0
      ? intent.imports.join(', ')
      : cleanFeatureName;
    const importLine = intent.imports.length > 0
      ? `import { ${importNames} } from '${relativeImport}';`
      : `// Source: ${relativeImport}`;

    // Build mock setup code
    let mocksCode = '';
    if (intent.mockRequirements.includes('filesystem')) {
      mocksCode += `\n// Mock filesystem operations for isolated testing\nvi.mock('fs/promises');\n`;
    }
    if (intent.mockRequirements.includes('network')) {
      mocksCode += `\n// Mock network calls\nglobal.fetch = vi.fn();\n`;
    }

    // Generate test cases with real assertions
    const testCases = intent.assertions.map((assertion) => {
      const methodParts = assertion.targetMethod.split('.');
      const callExpression = methodParts.length > 1
        ? `${methodParts[0]}.${methodParts[1]}`
        : assertion.targetMethod;

      // Build real assertion logic based on return type
      let testBody: string;

      if (assertion.returnType.includes('Promise') || assertion.isAsync) {
        if (assertion.description.includes('edge case') || assertion.description.includes('invalid')) {
          testBody = `    // Verify edge case handling
    const result = ${callExpression}(${assertion.targetParams.length > 0 ? generateEdgeCaseArgs(assertion.targetParams) : ''});
    // Should not throw for edge cases — verify graceful handling
    await expect(result).resolves.toBeDefined();`;
        } else {
          testBody = `    // Act
    const result = await ${callExpression}(${generateSampleArgs(assertion.targetParams)});

    // Assert — verify the function returns a defined, non-null result
    expect(result).toBeDefined();
    expect(result).not.toBeNull();`;
        }
      } else if (assertion.returnType === 'boolean') {
        testBody = `    // Act
    const result = ${callExpression}(${generateSampleArgs(assertion.targetParams)});

    // Assert — verify boolean return
    expect(typeof result).toBe('boolean');`;
      } else if (assertion.returnType === 'number') {
        testBody = `    // Act
    const result = ${callExpression}(${generateSampleArgs(assertion.targetParams)});

    // Assert — verify numeric return
    expect(typeof result).toBe('number');
    expect(result).not.toBeNaN();`;
      } else if (assertion.returnType === 'string') {
        testBody = `    // Act
    const result = ${callExpression}(${generateSampleArgs(assertion.targetParams)});

    // Assert — verify string return
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);`;
      } else {
        testBody = `    // Act
    const result = ${assertion.isAsync ? 'await ' : ''}${callExpression}(${generateSampleArgs(assertion.targetParams)});

    // Assert — verify the return value
    expect(result).toBeDefined();`;
      }

      return `  it('${assertion.description}', ${assertion.isAsync ? 'async ' : ''}() => {
${testBody}
  });`;
    }).join('\n\n');

    const code = `// ============================================================
// Generated Unit Tests for: ${intent.featureName}
// Source: ${sourceCodePath}
// ============================================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
${importLine}
${mocksCode}
describe('${intent.featureName} Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

${testCases}
});
`;

    const fileName = `${cleanFeatureName}.test.ts`;

    return {
      fileName,
      filePath: `tests/${fileName}`,
      code,
    };
  }
}

/**
 * Coverage analyzer that reads real vitest/jest coverage output
 */
export class CoverageAnalyzer {
  /**
   * Parse lcov/istanbul JSON report and calculate core stats
   */
  static analyzeCoverage(lcovJson: any): CoverageReport {
    log.info('Analyzing test coverage reports');

    if (!lcovJson || typeof lcovJson !== 'object') {
      return {
        overallCoverage: 0,
        coveredLines: 0,
        totalLines: 0,
        uncoveredFiles: [],
      };
    }

    let total = 0;
    let covered = 0;
    const uncoveredFiles: CoverageReport['uncoveredFiles'] = [];

    for (const [file, data] of Object.entries(lcovJson)) {
      if (file === 'total') continue; // Skip summary entry

      const stats = data as { total?: number; covered?: number; uncoveredLines?: number[]; lines?: { total: number; covered: number } };
      const fileTotal = stats.lines?.total || stats.total || 0;
      const fileCovered = stats.lines?.covered || stats.covered || 0;

      total += fileTotal;
      covered += fileCovered;

      const percentage = fileTotal > 0 ? Math.round((fileCovered / fileTotal) * 100) : 0;

      if (percentage < 80) {
        uncoveredFiles.push({
          filePath: file,
          uncoveredLines: stats.uncoveredLines || [],
          percentage,
        });
      }
    }

    const overallCoverage = total > 0 ? Math.round((covered / total) * 100) : 0;

    return {
      overallCoverage,
      coveredLines: covered,
      totalLines: total,
      uncoveredFiles: uncoveredFiles.sort((a, b) => a.percentage - b.percentage),
    };
  }

  /**
   * Read and analyze coverage from vitest's default coverage output directory
   */
  static async analyzeCoverageFromFile(rootPath: string): Promise<CoverageReport> {
    const possiblePaths = [
      join(rootPath, 'coverage', 'coverage-summary.json'),
      join(rootPath, 'coverage', 'coverage-final.json'),
    ];

    for (const coveragePath of possiblePaths) {
      if (await fileExists(coveragePath)) {
        try {
          const content = await readFile(coveragePath, 'utf-8');
          const data = JSON.parse(content);
          return this.analyzeCoverage(data);
        } catch (error) {
          log.warn({ coveragePath, error }, 'Failed to parse coverage file');
        }
      }
    }

    log.warn({ rootPath }, 'No coverage report found. Run tests with --coverage flag first.');
    return {
      overallCoverage: 0,
      coveredLines: 0,
      totalLines: 0,
      uncoveredFiles: [],
    };
  }

  /**
   * Scan a project for untested source files (files without corresponding test files)
   */
  static async findUntestedFiles(rootPath: string): Promise<string[]> {
    const files = await listFilesRecursive(rootPath);
    const sourceFiles = files.filter((f) => !isBinaryFile(f) && (f.endsWith('.ts') || f.endsWith('.js')));
    const testFiles = sourceFiles.filter((f) => {
      const rel = f.replace(rootPath, '');
      return rel.includes('.test.') || rel.includes('.spec.') || rel.includes('__tests__');
    });
    const srcFiles = sourceFiles.filter((f) => {
      const rel = f.replace(rootPath, '');
      return !rel.includes('.test.') && !rel.includes('.spec.') && !rel.includes('__tests__');
    });

    const untested: string[] = [];
    for (const src of srcFiles) {
      const base = basename(src, extname(src));
      if (base === 'index' || base.startsWith('types')) continue;
      const hasTest = testFiles.some((t) => basename(t).includes(base));
      if (!hasTest) untested.push(src);
    }

    return untested;
  }
}

// Helper functions for test argument generation

function generateSampleArgs(params: string[]): string {
  if (params.length === 0) return '';
  return params.map((p) => {
    const lower = p.toLowerCase();
    if (lower.includes('path') || lower.includes('dir') || lower.includes('root')) return `'/tmp/test-workspace'`;
    if (lower.includes('id') || lower.includes('name') || lower.includes('label')) return `'test-value'`;
    if (lower.includes('count') || lower.includes('num') || lower.includes('limit') || lower.includes('max')) return '10';
    if (lower.includes('flag') || lower.includes('enabled') || lower.includes('active')) return 'true';
    if (lower.includes('options') || lower.includes('config') || lower.includes('opts')) return '{}';
    if (lower.includes('list') || lower.includes('items') || lower.includes('files')) return '[]';
    return `'test-${p}'`;
  }).join(', ');
}

function generateEdgeCaseArgs(params: string[]): string {
  if (params.length === 0) return '';
  return params.map((p) => {
    const lower = p.toLowerCase();
    if (lower.includes('path') || lower.includes('dir')) return `''`;
    if (lower.includes('count') || lower.includes('num')) return '0';
    if (lower.includes('list') || lower.includes('items')) return '[]';
    return `''`;
  }).join(', ');
}
