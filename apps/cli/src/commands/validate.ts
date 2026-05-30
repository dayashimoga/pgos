// ============================================================
// @pgos/cli — Validate Command
// Run validation suites on a project and PERSIST results
// ============================================================

import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { resolve, join } from 'path';
import { mkdir, writeFile } from 'fs/promises';
import { VERSION } from '@pgos/core';
import { checkCompletion } from '@pgos/validation-engine';
import { detectHallucinations } from '@pgos/hallucination-detector';
import { inferArchitecture } from '@pgos/architecture-guard';

export function registerValidateCommand(program: Command): void {
  program
    .command('validate')
    .description('Run validation suite on project')
    .argument('[path]', 'Project root path', '.')
    .option('-r, --requirements <reqs>', 'Comma-separated requirements to validate')
    .option('--completion', 'Run completion check only')
    .option('--hallucination', 'Run hallucination check only')
    .option('--architecture', 'Run architecture check only')
    .action(async (projectPath: string, options: {
      requirements?: string;
      completion?: boolean;
      hallucination?: boolean;
      architecture?: boolean;
    }) => {
      const rootPath = resolve(process.cwd(), projectPath);
      const requirements = options.requirements ? options.requirements.split(',').map((r) => r.trim()) : [];
      const runAll = !options.completion && !options.hallucination && !options.architecture;
      const runStartTime = Date.now();

      console.log(chalk.bold('\n  🛡️  Guardian Validation Suite\n'));

      let completionResult: any = null;
      let hallucinationResult: any = null;
      let architectureResult: any = null;

      // Completion Check
      if (runAll || options.completion) {
        const spinner = ora('Checking completion...').start();
        try {
          completionResult = await checkCompletion(rootPath, requirements);
          spinner.succeed(getScoreLabel('Completion', completionResult.overall));

          if (completionResult.antiPatterns.length > 0) {
            console.log(chalk.dim(`    ⚠ ${completionResult.antiPatterns.length} anti-patterns detected`));
            for (const ap of completionResult.antiPatterns.slice(0, 5)) {
              console.log(chalk.dim(`      - ${ap.type}: ${ap.file.split(/[\\/]/).pop()}:${ap.line}`));
            }
            if (completionResult.antiPatterns.length > 5) {
              console.log(chalk.dim(`      ... and ${completionResult.antiPatterns.length - 5} more`));
            }
          }

          if (requirements.length > 0) {
            console.log(chalk.dim(`    ✅ ${completionResult.completedRequirements} complete, ⚠ ${completionResult.partialRequirements} partial, ❌ ${completionResult.absentRequirements} absent`));
          }
        } catch (error) {
          spinner.fail(chalk.red('Completion check failed'));
        }
      }

      // Hallucination Check
      if (runAll || options.hallucination) {
        const spinner = ora('Detecting hallucinations...').start();
        try {
          hallucinationResult = await detectHallucinations(rootPath);
          spinner.succeed(getScoreLabel('Hallucination Safety', hallucinationResult.score));

          if (hallucinationResult.issues.length > 0) {
            console.log(chalk.dim(`    ⚠ ${hallucinationResult.issues.length} potential issues found`));
            for (const issue of hallucinationResult.issues.slice(0, 5)) {
              console.log(chalk.dim(`      - ${issue.type}: ${issue.file.split(/[\\/]/).pop()}:${issue.line}`));
            }
          }
        } catch (error) {
          spinner.fail(chalk.red('Hallucination check failed'));
        }
      }

      // Architecture Check
      if (runAll || options.architecture) {
        const spinner = ora('Analyzing architecture...').start();
        try {
          architectureResult = await inferArchitecture(rootPath);
          spinner.succeed(chalk.green(`Architecture: ${architectureResult.layers.length} layers detected, ${architectureResult.rules.length} rules`));

          for (const layer of architectureResult.layers.slice(0, 5)) {
            console.log(chalk.dim(`    📁 ${layer.name} (${layer.fileCount} files)`));
          }
        } catch (error) {
          spinner.fail(chalk.red('Architecture check failed'));
        }
      }

      // ─── PERSIST ALL RESULTS TO .guardian/ ───────────────────────
      const runDuration = Date.now() - runStartTime;
      const timestamp = new Date().toISOString();

      try {
        // Ensure directories exist
        const validationDir = join(rootPath, '.guardian', 'validation');
        const architectureDir = join(rootPath, '.guardian', 'architecture');
        const telemetryDir = join(rootPath, '.guardian', 'telemetry');
        const decisionsDir = join(rootPath, '.guardian', 'decisions');

        await mkdir(validationDir, { recursive: true });
        await mkdir(architectureDir, { recursive: true });
        await mkdir(telemetryDir, { recursive: true });
        await mkdir(decisionsDir, { recursive: true });

        // 1. Persist completion results
        if (completionResult) {
          const completionOutput = {
            pgosVersion: VERSION,
            generatedAt: timestamp,
            rootPath,
            overall: completionResult.overall,
            completedRequirements: completionResult.completedRequirements,
            partialRequirements: completionResult.partialRequirements,
            absentRequirements: completionResult.absentRequirements,
            antiPatternCount: completionResult.antiPatterns.length,
            antiPatterns: completionResult.antiPatterns.map((ap: any) => ({
              type: ap.type,
              file: ap.file,
              line: ap.line,
              description: ap.description || '',
            })),
          };
          await writeFile(join(validationDir, 'completion-result.json'), JSON.stringify(completionOutput, null, 2));
        }

        // 2. Persist hallucination results
        if (hallucinationResult) {
          const hallucinationOutput = {
            pgosVersion: VERSION,
            generatedAt: timestamp,
            rootPath,
            score: hallucinationResult.score,
            filesScanned: hallucinationResult.filesScanned,
            issueCount: hallucinationResult.issues.length,
            issues: hallucinationResult.issues.map((issue: any) => ({
              type: issue.type,
              file: issue.file,
              line: issue.line,
              explanation: issue.explanation,
              severity: issue.severity || 'warning',
            })),
          };
          await writeFile(join(validationDir, 'hallucination-result.json'), JSON.stringify(hallucinationOutput, null, 2));
        }

        // 3. Persist architecture analysis
        if (architectureResult) {
          const architectureOutput = {
            pgosVersion: VERSION,
            generatedAt: timestamp,
            rootPath,
            layerCount: architectureResult.layers.length,
            ruleCount: architectureResult.rules.length,
            layers: architectureResult.layers.map((layer: any) => ({
              name: layer.name,
              fileCount: layer.fileCount,
              files: layer.files || [],
            })),
            rules: architectureResult.rules.map((rule: any) => ({
              name: rule.name || rule.from,
              from: rule.from,
              to: rule.to,
              type: rule.type || 'dependency',
            })),
          };
          await writeFile(join(architectureDir, 'inferred-architecture.json'), JSON.stringify(architectureOutput, null, 2));
        }

        // 4. Write telemetry for this run
        const telemetryEntry = {
          pgosVersion: VERSION,
          command: 'validate',
          executedAt: timestamp,
          durationMs: runDuration,
          rootPath,
          results: {
            completionScore: completionResult?.overall ?? null,
            hallucinationScore: hallucinationResult?.score ?? null,
            architectureLayers: architectureResult?.layers.length ?? null,
            antiPatternCount: completionResult?.antiPatterns.length ?? null,
            hallucinationIssues: hallucinationResult?.issues.length ?? null,
          },
        };
        const telemetryFile = `validate-${Date.now()}.json`;
        await writeFile(join(telemetryDir, telemetryFile), JSON.stringify(telemetryEntry, null, 2));

        // 5. Append to decision log
        const decisionEntry = {
          pgosVersion: VERSION,
          timestamp,
          command: 'validate',
          decision: completionResult && completionResult.overall >= 80
            ? 'PASS — Project meets quality threshold'
            : 'REVIEW — Project has quality concerns that need attention',
          evidence: {
            completionScore: completionResult?.overall ?? null,
            hallucinationScore: hallucinationResult?.score ?? null,
            antiPatterns: completionResult?.antiPatterns.length ?? 0,
          },
        };

        // Read existing log or start fresh
        let decisionLog: any[] = [];
        try {
          const { readFile } = await import('fs/promises');
          const existing = await readFile(join(decisionsDir, 'decision-log.json'), 'utf-8');
          decisionLog = JSON.parse(existing);
        } catch {
          // No existing log, start fresh
        }
        decisionLog.push(decisionEntry);
        // Keep last 50 entries
        if (decisionLog.length > 50) decisionLog = decisionLog.slice(-50);
        await writeFile(join(decisionsDir, 'decision-log.json'), JSON.stringify(decisionLog, null, 2));

        console.log(chalk.dim('\n  📁 Results persisted to .guardian/validation/, .guardian/architecture/'));
      } catch (err) {
        // Don't fail the whole command if persistence fails
        console.log(chalk.dim('\n  ⚠ Could not persist results to .guardian/'));
      }

      console.log('');
    });
}

function getScoreLabel(name: string, score: number): string {
  if (score >= 90) return chalk.green(`${name}: ${score}% ✓`);
  if (score >= 70) return chalk.yellow(`${name}: ${score}% ⚠`);
  if (score >= 50) return chalk.hex('#FFA500')(`${name}: ${score}% ⚠`);
  return chalk.red(`${name}: ${score}% ✗`);
}
