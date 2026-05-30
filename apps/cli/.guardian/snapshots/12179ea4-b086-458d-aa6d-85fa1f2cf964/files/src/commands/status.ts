// ============================================================
// @pgos/cli — Status Command
// Show project health and status
// ============================================================

import type { Command } from 'commander';
import chalk from 'chalk';
import { join } from 'path';
import { fileExists, VERSION, GUARDIAN_DIR } from '@pgos/core';
import { listSnapshots } from '@pgos/recovery-engine';

export function registerStatusCommand(program: Command): void {
  program
    .command('status')
    .description('Show project Guardian OS status')
    .argument('[path]', 'Project root path', '.')
    .action(async (projectPath: string) => {
      const rootPath = join(process.cwd(), projectPath);
      const guardianDir = join(rootPath, GUARDIAN_DIR);
      const initialized = await fileExists(guardianDir);

      console.log('');
      console.log(chalk.bold(`  ⚡ Guardian OS v${VERSION}`));
      console.log('');

      if (!initialized) {
        console.log(chalk.yellow('  ⚠ Not initialized. Run: guardian init'));
        console.log('');
        return;
      }

      console.log(`  ${chalk.dim('Status:')}  ${chalk.green('● Active')}`);
      console.log(`  ${chalk.dim('Path:')}    ${chalk.white(rootPath)}`);

      // Count snapshots
      try {
        const snapshots = await listSnapshots(rootPath);
        console.log(`  ${chalk.dim('Snapshots:')} ${chalk.white(String(snapshots.length))}`);

        if (snapshots.length > 0) {
          const latest = snapshots[0]!;
          console.log(`  ${chalk.dim('Latest:')}    ${chalk.dim(new Date(latest.createdAt).toLocaleString())} ${latest.label ? chalk.cyan(`[${latest.label}]`) : ''}`);
        }
      } catch {
        console.log(`  ${chalk.dim('Snapshots:')} ${chalk.dim('none')}`);
      }

      console.log('');
      console.log(chalk.dim('  Commands:'));
      console.log(chalk.dim('    guardian context compile   — Build context'));
      console.log(chalk.dim('    guardian snapshot stable   — Create snapshot'));
      console.log(chalk.dim('    guardian validate          — Run validations'));
      console.log('');
    });
}
