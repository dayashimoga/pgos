// ============================================================
// @pgos/cli — Validate Command
// Run validation suites on a project
// ============================================================

import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { join } from 'path';
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
      const rootPath = join(process.cwd(), projectPath);
      const requirements = options.requirements ? options.requirements.split(',').map((r) => r.trim()) : [];
      const runAll = !options.completion && !options.hallucination && !options.architecture;

      console.log(chalk.bold('\n  🛡️  Guardian Validation Suite\n'));

      // Completion Check
      if (runAll || options.completion) {
        const spinner = ora('Checking completion...').start();
        try {
          const result = await checkCompletion(rootPath, requirements);
          spinner.succeed(getScoreLabel('Completion', result.overall));

          if (result.antiPatterns.length > 0) {
            console.log(chalk.dim(`    ⚠ ${result.antiPatterns.length} anti-patterns detected`));
            for (const ap of result.antiPatterns.slice(0, 5)) {
              console.log(chalk.dim(`      - ${ap.type}: ${ap.file.split(/[\\/]/).pop()}:${ap.line}`));
            }
            if (result.antiPatterns.length > 5) {
              console.log(chalk.dim(`      ... and ${result.antiPatterns.length - 5} more`));
            }
          }

          if (requirements.length > 0) {
            console.log(chalk.dim(`    ✅ ${result.completedRequirements} complete, ⚠ ${result.partialRequirements} partial, ❌ ${result.absentRequirements} absent`));
          }
        } catch (error) {
          spinner.fail(chalk.red('Completion check failed'));
        }
      }

      // Hallucination Check
      if (runAll || options.hallucination) {
        const spinner = ora('Detecting hallucinations...').start();
        try {
          const result = await detectHallucinations(rootPath);
          spinner.succeed(getScoreLabel('Hallucination Safety', result.score));

          if (result.issues.length > 0) {
            console.log(chalk.dim(`    ⚠ ${result.issues.length} potential issues found`));
            for (const issue of result.issues.slice(0, 5)) {
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
          const result = await inferArchitecture(rootPath);
          spinner.succeed(chalk.green(`Architecture: ${result.layers.length} layers detected, ${result.rules.length} rules`));

          for (const layer of result.layers.slice(0, 5)) {
            console.log(chalk.dim(`    📁 ${layer.name} (${layer.fileCount} files)`));
          }
        } catch (error) {
          spinner.fail(chalk.red('Architecture check failed'));
        }
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
