import { describe, it, expect, afterAll } from 'vitest';
import { IntentParser, TestGenerator, CoverageAnalyzer } from '../index.js';
import { join, dirname } from 'path';
import { mkdir, writeFile, rm } from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('PGOS Test Engine', () => {
  const mockRoot = join(__dirname, 'mock-project-testengine');

  afterAll(async () => {
    await rm(mockRoot, { recursive: true, force: true });
  });

  describe('IntentParser', () => {
    it('should parse real source code to generate intents', async () => {
      await mkdir(join(mockRoot, 'src'), { recursive: true });
      const sourceFile = join(mockRoot, 'src', 'calculator.ts');
      await writeFile(sourceFile, `
export function add(a: number, b: number): number { return a + b; }
export async function fetchUser(id: string): Promise<any> { return { id }; }
export class MathUtils {
  static multiply(x: number, y: number): number { return x * y; }
}
`);

      const intent = await IntentParser.parseIntent(sourceFile);
      
      expect(intent.featureName).toBe('calculator');
      expect(intent.assertions.length).toBeGreaterThan(0);
      
      // Should find exported functions
      const addAssertion = intent.assertions.find(a => a.targetMethod === 'add');
      expect(addAssertion).toBeDefined();
      expect(addAssertion!.targetParams).toEqual(['a', 'b']);
      expect(addAssertion!.returnType).toBe('number');
      expect(addAssertion!.isAsync).toBe(false);

      // Should find async functions
      const fetchAssertion = intent.assertions.find(a => a.targetMethod === 'fetchUser');
      expect(fetchAssertion).toBeDefined();
      expect(fetchAssertion!.isAsync).toBe(true);

      // Should find class methods
      const mathAssertion = intent.assertions.find(a => a.targetMethod === 'MathUtils.multiply');
      expect(mathAssertion).toBeDefined();
      
      // Should find exported symbols for imports
      expect(intent.imports).toContain('add');
      expect(intent.imports).toContain('fetchUser');
      expect(intent.imports).toContain('MathUtils');
    });

    it('should detect mock requirements from imports', async () => {
      const sourceFile = join(mockRoot, 'src', 'db.ts');
      await writeFile(sourceFile, `
import { sql } from 'postgres';
import fs from 'fs/promises';
import axios from 'axios';
export function doThings() {}
`);
      const intent = await IntentParser.parseIntent(sourceFile);
      expect(intent.mockRequirements).toContain('database');
      expect(intent.mockRequirements).toContain('filesystem');
      expect(intent.mockRequirements).toContain('network');
    });

    it('should fallback to requirement string parsing if source file unavailable', async () => {
      const intent = await IntentParser.parseIntent('nonexistent.ts', 'implement user auth and validate passwords');
      
      expect(intent.assertions.length).toBeGreaterThan(0);
      expect(intent.assertions.some(a => a.targetMethod === 'validate')).toBe(true);
    });
  });

  describe('TestGenerator', () => {
    it('should generate a test file with real imports and assertions', async () => {
      const intent = await IntentParser.parseIntent('dummy.ts', 'implement calculator');
      // Override for predictability
      intent.featureName = 'calculator';
      intent.imports = ['add', 'subtract'];
      intent.assertions = [
        {
          description: 'should add numbers',
          expectedBehavior: 'returns number',
          targetMethod: 'add',
          targetParams: ['a', 'b'],
          returnType: 'number',
          isAsync: false
        }
      ];

      const sourceCodePath = 'src/utils/calculator.ts';
      const result = TestGenerator.generateTests(intent, sourceCodePath);

      expect(result.fileName).toBe('calculator.test.ts');
      // Real import statement
      expect(result.code).toContain("import { add, subtract } from 'src/utils/calculator.js'");
      // Vitest imports
      expect(result.code).toContain("import { describe, it, expect");
      // Real assertion structure
      expect(result.code).toContain("expect(typeof result).toBe('number')");
      // Target method invocation
      expect(result.code).toContain("add('test-a', 'test-b')");
    });
  });

  describe('CoverageAnalyzer', () => {
    it('should parse lcov JSON report and calculate core stats', () => {
      const lcov = {
        "src/auth.ts": { lines: { total: 100, covered: 50 }, uncoveredLines: [10, 11] },
        "src/utils.ts": { lines: { total: 50, covered: 50 }, uncoveredLines: [] }
      };

      const report = CoverageAnalyzer.analyzeCoverage(lcov);
      
      expect(report.totalLines).toBe(150);
      expect(report.coveredLines).toBe(100);
      expect(report.overallCoverage).toBe(Math.round((100 / 150) * 100));
      expect(report.uncoveredFiles.length).toBe(1);
      expect(report.uncoveredFiles[0].filePath).toBe('src/auth.ts');
    });

    it('should find untested files in project', async () => {
      await mkdir(join(mockRoot, 'coverage-test'), { recursive: true });
      await writeFile(join(mockRoot, 'coverage-test', 'tested.ts'), 'export const a = 1;');
      await writeFile(join(mockRoot, 'coverage-test', 'tested.test.ts'), 'test("a", () => {})');
      await writeFile(join(mockRoot, 'coverage-test', 'untested.ts'), 'export const b = 2;');
      
      // Setup the package.json to avoid core traversing up too far
      await writeFile(join(mockRoot, 'coverage-test', 'package.json'), '{}');

      const untested = await CoverageAnalyzer.findUntestedFiles(join(mockRoot, 'coverage-test'));
      expect(untested.length).toBe(1);
      expect(untested[0]).toContain('untested.ts');
    });
  });
});
