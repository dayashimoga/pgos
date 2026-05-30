// ============================================================
// @pgos/cli — Init Command
// Initialize PGOS for a project with default policies & telemetry
// ============================================================

import type { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { join, resolve } from 'path';
import { ensureDir, GUARDIAN_DIRS, VERSION } from '@pgos/core';
import { writeFile } from 'fs/promises';

export function registerInitCommand(program: Command): void {
  program
    .command('init')
    .description('Initialize Project Guardian OS for a project')
    .argument('[path]', 'Project root path', '.')
    .option('-n, --name <name>', 'Project name')
    .action(async (projectPath: string, options: { name?: string }) => {
      const rootPath = resolve(process.cwd(), projectPath);
      const spinner = ora('Initializing Guardian OS...').start();
      const timestamp = new Date().toISOString();

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
            createdAt: timestamp,
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

        // ─── POPULATE DEFAULT POLICIES ────────────────────────────
        const defaultPolicies = {
          pgosVersion: VERSION,
          createdAt: timestamp,
          description: 'Default PGOS validation and quality policies',
          policies: {
            antiPatterns: {
              enabled: true,
              severity: 'warning',
              rules: [
                { name: 'no-todo', pattern: 'TODO', description: 'Disallow TODO comments in production code' },
                { name: 'no-fixme', pattern: 'FIXME', description: 'Disallow FIXME comments' },
                { name: 'no-hack', pattern: 'HACK', description: 'Disallow HACK markers' },
                { name: 'no-empty-functions', pattern: '{}', description: 'Disallow empty function bodies' },
                { name: 'no-placeholder', pattern: 'placeholder|lorem ipsum', description: 'Disallow placeholder text' },
                { name: 'no-hardcoded-secrets', pattern: 'password|secret|key|token', description: 'Flag hardcoded credentials' },
                { name: 'no-mock-logic', pattern: 'mock.*return', description: 'Flag mock return logic in production' },
              ],
            },
            hallucination: {
              enabled: true,
              severity: 'error',
              description: 'Flag imports of undeclared external packages',
            },
            architecture: {
              enabled: true,
              severity: 'warning',
              rules: [
                { name: 'no-circular-deps', description: 'Disallow circular dependencies between modules' },
                { name: 'layer-isolation', description: 'Libraries must not import from application layers' },
              ],
            },
            snapshots: {
              autoBeforePrompt: true,
              retentionDays: 30,
              maxSnapshots: 100,
            },
          },
        };
        await writeFile(
          join(rootPath, '.guardian', 'policies', 'default-policies.json'),
          JSON.stringify(defaultPolicies, null, 2),
          'utf-8'
        );

        // ─── WRITE INIT TELEMETRY ─────────────────────────────────
        const initTelemetry = {
          pgosVersion: VERSION,
          command: 'init',
          executedAt: timestamp,
          rootPath,
          projectName: config.project.name,
          directoriesCreated: Object.keys(GUARDIAN_DIRS).length,
          policiesCreated: defaultPolicies.policies.antiPatterns.rules.length,
        };
        await writeFile(
          join(rootPath, '.guardian', 'telemetry', `init-${Date.now()}.json`),
          JSON.stringify(initTelemetry, null, 2),
          'utf-8'
        );

        spinner.succeed(chalk.green('Guardian OS initialized!'));
        console.log('');
        console.log(chalk.dim('  Created:'));
        for (const [key, dir] of Object.entries(GUARDIAN_DIRS)) {
          console.log(chalk.dim(`    📁 ${dir}`));
        }
        console.log(chalk.dim('    📄 .guardian/policies/default-policies.json'));
        console.log(chalk.dim('    📄 .guardian/telemetry/init record'));
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
