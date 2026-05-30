// ============================================================
// @pgos/cli — Context Command
// Compile and export project context
// ============================================================

import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { join } from 'path';
import { writeFile } from 'fs/promises';
import { formatTokens } from '@pgos/core';
import { compileContext, packageContext } from '@pgos/context-engine';

export function registerContextCommand(program: Command): void {
  const ctx = program
    .command('context')
    .description('Manage project context');

  ctx
    .command('compile')
    .description('Compile project context')
    .argument('[path]', 'Project root path', '.')
    .option('-l, --levels <levels>', 'Context levels (comma-separated)', 'L0,L1,L2')
    .action(async (projectPath: string, options: { levels: string }) => {
      const rootPath = join(process.cwd(), projectPath);
      const levels = options.levels.split(',') as ('L0' | 'L1' | 'L2' | 'L3' | 'L4')[];
      const spinner = ora('Compiling context...').start();

      try {
        const result = await compileContext('cli-project', rootPath, { levels });

        spinner.succeed(chalk.green('Context compiled!'));
        console.log('');
        console.log(`  ${chalk.dim('Files processed:')} ${chalk.white(String(result.filesProcessed))}`);
        console.log(`  ${chalk.dim('Total tokens:')}    ${chalk.yellow(formatTokens(result.totalTokens))}`);
        console.log(`  ${chalk.dim('Optimized:')}       ${chalk.green(formatTokens(result.optimizedTokens))}`);
        console.log(`  ${chalk.dim('Reduction:')}       ${chalk.cyan(`${result.reductionPercent}%`)}`);
        console.log(`  ${chalk.dim('Duration:')}        ${chalk.white(`${result.duration}ms`)}`);
        console.log('');
      } catch (error) {
        spinner.fail(chalk.red('Context compilation failed'));
        console.error(error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  ctx
    .command('export')
    .description('Export context for AI model')
    .argument('[path]', 'Project root path', '.')
    .option('-m, --model <model>', 'Target model', 'gpt-4')
    .option('-f, --format <format>', 'Output format (yaml|json|markdown|xml)', 'yaml')
    .option('-t, --max-tokens <tokens>', 'Max token budget', '40000')
    .option('-o, --output <file>', 'Output file', 'project_context.yaml')
    .action(async (projectPath: string, options: { model: string; format: string; maxTokens: string; output: string }) => {
      const rootPath = join(process.cwd(), projectPath);
      const spinner = ora(`Exporting context for ${options.model}...`).start();

      try {
        const result = await compileContext('cli-project', rootPath, { levels: ['L0', 'L1', 'L2'] });
        const packaged = packageContext(result.packages, {
          targetModel: options.model,
          format: options.format as 'yaml' | 'json' | 'markdown' | 'xml',
          maxTokens: parseInt(options.maxTokens, 10),
        });

        await writeFile(join(rootPath, options.output), packaged.content, 'utf-8');

        spinner.succeed(chalk.green(`Context exported to ${options.output}`));
        console.log('');
        console.log(`  ${chalk.dim('Format:')} ${chalk.white(packaged.format)}`);
        console.log(`  ${chalk.dim('Tokens:')} ${chalk.yellow(formatTokens(packaged.tokens))}`);
        console.log(`  ${chalk.dim('Model:')}  ${chalk.cyan(packaged.modelTarget)}`);
        console.log('');
      } catch (error) {
        spinner.fail(chalk.red('Export failed'));
        console.error(error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });
}
