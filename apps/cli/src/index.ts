#!/usr/bin/env node
// ============================================================
// @pgos/cli — Guardian CLI
// Command-line interface for Project Guardian OS
// ============================================================

import { Command } from 'commander';
import chalk from 'chalk';
import { VERSION } from '@pgos/core';
import { registerInitCommand } from './commands/init.js';
import { registerContextCommand } from './commands/context.js';
import { registerSnapshotCommand } from './commands/snapshot.js';
import { registerValidateCommand } from './commands/validate.js';
import { registerStatusCommand } from './commands/status.js';
import { registerDocsCommand } from './commands/docs.js';
import { registerRecoveryCommand } from './commands/recovery.js';
import { registerReportCommand } from './commands/report.js';

const program = new Command();

// ASCII banner
const banner = `
  ${chalk.cyan('╔══════════════════════════════════════════╗')}
  ${chalk.cyan('║')}  ${chalk.bold.white('⚡ Project Guardian OS')}${chalk.dim(` v${VERSION}`)}         ${chalk.cyan('║')}
  ${chalk.cyan('║')}  ${chalk.dim('AI-native project operating system')}     ${chalk.cyan('║')}
  ${chalk.cyan('╚══════════════════════════════════════════╝')}
`;

program
  .name('guardian')
  .description('Project Guardian OS — AI-native project runtime')
  .version(VERSION)
  .addHelpText('before', banner);

// Register commands
registerInitCommand(program);
registerContextCommand(program);
registerSnapshotCommand(program);
registerValidateCommand(program);
registerStatusCommand(program);
registerDocsCommand(program);
registerRecoveryCommand(program);
registerReportCommand(program);

program.parse();
