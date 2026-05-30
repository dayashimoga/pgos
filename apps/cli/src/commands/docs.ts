import { Command } from 'commander';
import chalk from 'chalk';
import { DocOrchestrator } from '@pgos/doc-engine';
import { resolve } from 'path';

export function registerDocsCommand(program: Command) {
  const docs = program.command('docs').description('Generate master documentation set');

  docs
    .command('generate')
    .description('Generate documentation and diagrams for the project')
    .option('-r, --root-path <path>', 'Project root path', process.cwd())
    .action(async (options) => {
      try {
        const rootPath = resolve(options.rootPath);
        console.log(chalk.cyan('Generating master documentation set...'));
        
        await DocOrchestrator.handleCodeChange(rootPath);
        
        console.log(chalk.green('✔ Documentation generated successfully.'));
      } catch (error: any) {
        console.error(chalk.red(`Failed to generate documentation: ${error.message}`));
        process.exit(1);
      }
    });
}
