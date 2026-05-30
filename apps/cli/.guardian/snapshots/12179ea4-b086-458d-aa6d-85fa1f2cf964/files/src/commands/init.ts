// ============================================================
// @pgos/cli — Init Command
// Initialize PGOS for a project
// ============================================================

import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { join } from 'path';
import { ensureDir, GUARDIAN_DIRS, VERSION } from '@pgos/core';
import { writeFile } from 'fs/promises';

export function registerInitCommand(program: Command): void {
  program
    .command('init')
    .description('Initialize Project Guardian OS for a project')
    .argument('[path]', 'Project root path', '.')
    .option('-n, --name <name>', 'Project name')
    .action(async (projectPath: string, options: { name?: string }) => {
      const rootPath = join(process.cwd(), projectPath);
      const spinner = ora('Initializing Guardian OS...').start();

      try {
        // Create .guardian directory structure
        for (const dir of Object.values(GUARDIAN_DIRS)) {
          await ensureDir(join(rootPath, dir));
        }

        // Create guardian config
        const config = {
          version: VERSION,
          project: {
            name: options.name || rootPath.split(/[\\/]/).pop() || 'project',
            rootPath,
            createdAt: new Date().toISOString(),
          },
          context: {
            levels: ['L0', 'L1', 'L2'],
            maxTokens: 40000,
            autoCompile: true,
          },
          snapshots: {
            autoSnapshot: true,
            retentionDays: 30,
            maxSnapshots: 100,
          },
          validation: {
            autoValidate: true,
            strictMode: false,
          },
        };

        await writeFile(
          join(rootPath, '.guardian', 'config.yaml'),
          JSON.stringify(config, null, 2),
          'utf-8'
        );

        spinner.succeed(chalk.green('Guardian OS initialized!'));
        console.log('');
        console.log(chalk.dim('  Created:'));
        for (const [key, dir] of Object.entries(GUARDIAN_DIRS)) {
          console.log(chalk.dim(`    📁 ${dir}`));
        }
        console.log('');
        console.log(chalk.cyan('  Next steps:'));
        console.log(chalk.dim('    guardian context compile   — Build project context'));
        console.log(chalk.dim('    guardian snapshot stable   — Create a stable snapshot'));
        console.log(chalk.dim('    guardian validate          — Run validations'));
        console.log(chalk.dim('    guardian status            — Check project health'));
        console.log('');
      } catch (error) {
        spinner.fail(chalk.red('Initialization failed'));
        console.error(error);
        process.exit(1);
      }
    });
}
