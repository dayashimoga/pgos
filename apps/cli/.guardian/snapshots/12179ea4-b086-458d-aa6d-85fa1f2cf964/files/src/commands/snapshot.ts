// ============================================================
// @pgos/cli — Snapshot Command
// Create and manage project snapshots
// ============================================================

import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { join } from 'path';
import { createSnapshot, listSnapshots } from '@pgos/recovery-engine';

export function registerSnapshotCommand(program: Command): void {
  const snap = program
    .command('snapshot')
    .description('Manage project snapshots');

  snap
    .command('create')
    .description('Create a new snapshot')
    .argument('[label]', 'Snapshot label (stable, checkpoint, pre-deploy)', 'checkpoint')
    .option('-p, --path <path>', 'Project root path', '.')
    .option('-n, --name <name>', 'Snapshot name')
    .action(async (label: string, options: { path: string; name?: string }) => {
      const rootPath = join(process.cwd(), options.path);
      const spinner = ora('Creating snapshot...').start();

      try {
        const snapshot = await createSnapshot({
          projectId: 'cli-project',
          rootPath,
          trigger: 'manual',
          label: label as 'stable' | 'checkpoint' | 'pre-deploy',
          name: options.name,
        });

        spinner.succeed(chalk.green('Snapshot created!'));
        console.log('');
        console.log(`  ${chalk.dim('ID:')}    ${chalk.white(snapshot.id)}`);
        console.log(`  ${chalk.dim('Label:')} ${chalk.cyan(snapshot.label || 'none')}`);
        console.log(`  ${chalk.dim('Files:')} ${chalk.white(String(snapshot.contents.files.length))}`);
        console.log(`  ${chalk.dim('Size:')}  ${chalk.yellow(formatBytes(snapshot.sizeBytes))}`);
        console.log('');
      } catch (error) {
        spinner.fail(chalk.red('Snapshot failed'));
        console.error(error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  // Convenience aliases
  snap
    .command('stable')
    .description('Create a stable snapshot')
    .option('-p, --path <path>', 'Project root path', '.')
    .action(async (options: { path: string }) => {
      const rootPath = join(process.cwd(), options.path);
      const spinner = ora('Creating stable snapshot...').start();

      try {
        const snapshot = await createSnapshot({
          projectId: 'cli-project',
          rootPath,
          trigger: 'manual',
          label: 'stable',
          name: `Stable - ${new Date().toLocaleDateString()}`,
        });

        spinner.succeed(chalk.green(`Stable snapshot created: ${snapshot.id.slice(0, 8)}`));
      } catch (error) {
        spinner.fail(chalk.red('Snapshot failed'));
        console.error(error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });

  snap
    .command('list')
    .description('List all snapshots')
    .option('-p, --path <path>', 'Project root path', '.')
    .action(async (options: { path: string }) => {
      const rootPath = join(process.cwd(), options.path);

      try {
        const snapshots = await listSnapshots(rootPath);

        if (snapshots.length === 0) {
          console.log(chalk.dim('\n  No snapshots found. Create one with: guardian snapshot stable\n'));
          return;
        }

        console.log(chalk.bold('\n  Snapshots:\n'));
        for (const snap of snapshots) {
          const date = new Date(snap.createdAt).toLocaleString();
          const label = snap.label ? chalk.cyan(`[${snap.label}]`) : '';
          console.log(`  ${chalk.dim(snap.id.slice(0, 8))}  ${label} ${chalk.white(snap.name || 'Unnamed')}  ${chalk.dim(date)}  ${chalk.yellow(formatBytes(snap.sizeBytes))}`);
        }
        console.log('');
      } catch (error) {
        console.error(chalk.red('Failed to list snapshots'));
        console.error(error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
