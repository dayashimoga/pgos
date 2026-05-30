import { Command } from 'commander';
import chalk from 'chalk';
import { restoreFromSnapshot } from '@pgos/recovery-engine';
import { resolve } from 'path';

export function registerRecoveryCommand(program: Command) {
  const recovery = program.command('recovery').description('Manage system recovery and rollbacks');

  recovery
    .command('rollback')
    .description('Rollback the project to a previous snapshot')
    .requiredOption('-i, --id <id>', 'Snapshot ID to rollback to')
    .option('-r, --root-path <path>', 'Project root path', process.cwd())
    .option('-d, --dry-run', 'Preview changes without applying them')
    .action(async (options) => {
      try {
        const rootPath = resolve(options.rootPath);
        console.log(chalk.cyan(`Initiating rollback to snapshot ${options.id}...`));
        
        const result = await restoreFromSnapshot(rootPath, {
          snapshotId: options.id,
          scope: 'full',
          dryRun: options.dryRun,
        });
        
        if (options.dryRun) {
          console.log(chalk.yellow('Dry run complete. Files that would be restored:'), result.filesRestored);
        } else {
          console.log(chalk.green(`✔ Rollback successful. Restored ${result.filesRestored} files.`));
          if (result.newSnapshotId) {
            console.log(chalk.gray(`A safety snapshot was created before rollback: ${result.newSnapshotId}`));
          }
        }
      } catch (error: any) {
        console.error(chalk.red(`Rollback failed: ${error.message}`));
        process.exit(1);
      }
    });
}
