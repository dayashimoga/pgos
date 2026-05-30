// ============================================================
// @pgos/core — Git Utilities
// Git operations wrapper
// ============================================================

import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export interface GitLogEntry {
  sha: string;
  shortSha: string;
  message: string;
  author: string;
  date: Date;
  filesChanged: number;
}

export interface GitDiffEntry {
  file: string;
  status: 'added' | 'modified' | 'deleted' | 'renamed';
  linesAdded: number;
  linesRemoved: number;
}

/**
 * Execute a git command in a given directory
 */
export async function gitCommand(cwd: string, args: string[]): Promise<string> {
  try {
    const { stdout } = await execFileAsync('git', args, {
      cwd,
      maxBuffer: 10 * 1024 * 1024, // 10MB
    });
    return stdout.trim();
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(`Git command failed: git ${args.join(' ')}: ${msg}`);
  }
}

/**
 * Check if a directory is a git repository
 */
export async function isGitRepo(dir: string): Promise<boolean> {
  try {
    await gitCommand(dir, ['rev-parse', '--git-dir']);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the current branch name
 */
export async function getCurrentBranch(cwd: string): Promise<string> {
  return gitCommand(cwd, ['rev-parse', '--abbrev-ref', 'HEAD']);
}

/**
 * Get the current commit SHA
 */
export async function getCurrentSha(cwd: string): Promise<string> {
  return gitCommand(cwd, ['rev-parse', 'HEAD']);
}

/**
 * Get the short SHA of the current commit
 */
export async function getShortSha(cwd: string): Promise<string> {
  return gitCommand(cwd, ['rev-parse', '--short', 'HEAD']);
}

/**
 * Get git log entries
 */
export async function getLog(cwd: string, count: number = 20): Promise<GitLogEntry[]> {
  const format = '%H|%h|%s|%an|%aI|';
  const output = await gitCommand(cwd, [
    'log',
    `--max-count=${count}`,
    `--format=${format}`,
    '--shortstat',
  ]);

  const entries: GitLogEntry[] = [];
  const lines = output.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i]?.trim();
    if (!line || !line.includes('|')) {
      i++;
      continue;
    }

    const parts = line.split('|');
    if (parts.length < 5) {
      i++;
      continue;
    }

    let filesChanged = 0;
    // Next non-empty line might be the stat line
    if (i + 1 < lines.length) {
      const statLine = lines[i + 1]?.trim() || '';
      const match = statLine.match(/(\d+) files? changed/);
      if (match) {
        filesChanged = parseInt(match[1]!, 10);
        i++; // skip stat line
      }
    }

    entries.push({
      sha: parts[0]!,
      shortSha: parts[1]!,
      message: parts[2]!,
      author: parts[3]!,
      date: new Date(parts[4]!),
      filesChanged,
    });

    i++;
  }

  return entries;
}

/**
 * Get changed files (diff)
 */
export async function getChangedFiles(cwd: string, from?: string, to?: string): Promise<GitDiffEntry[]> {
  const args = ['diff', '--numstat', '--diff-filter=ADMR'];
  if (from) args.push(from);
  if (to) args.push(to);

  const output = await gitCommand(cwd, args);
  if (!output) return [];

  return output.split('\n').filter(Boolean).map((line) => {
    const [added, removed, file] = line.split('\t');
    return {
      file: file || '',
      status: 'modified' as const,
      linesAdded: parseInt(added || '0', 10),
      linesRemoved: parseInt(removed || '0', 10),
    };
  });
}

/**
 * Get list of untracked files
 */
export async function getUntrackedFiles(cwd: string): Promise<string[]> {
  const output = await gitCommand(cwd, ['ls-files', '--others', '--exclude-standard']);
  if (!output) return [];
  return output.split('\n').filter(Boolean);
}

/**
 * Get list of staged files
 */
export async function getStagedFiles(cwd: string): Promise<string[]> {
  const output = await gitCommand(cwd, ['diff', '--cached', '--name-only']);
  if (!output) return [];
  return output.split('\n').filter(Boolean);
}

/**
 * Create a git commit
 */
export async function createCommit(cwd: string, message: string, files?: string[]): Promise<string> {
  if (files && files.length > 0) {
    await gitCommand(cwd, ['add', ...files]);
  } else {
    await gitCommand(cwd, ['add', '-A']);
  }
  await gitCommand(cwd, ['commit', '-m', message]);
  return getCurrentSha(cwd);
}

/**
 * Get the remote URL
 */
export async function getRemoteUrl(cwd: string): Promise<string | null> {
  try {
    return await gitCommand(cwd, ['remote', 'get-url', 'origin']);
  } catch {
    return null;
  }
}

/**
 * Stash current changes
 */
export async function stash(cwd: string, message?: string): Promise<void> {
  const args = ['stash', 'push'];
  if (message) args.push('-m', message);
  await gitCommand(cwd, args);
}

/**
 * Pop stashed changes
 */
export async function stashPop(cwd: string): Promise<void> {
  await gitCommand(cwd, ['stash', 'pop']);
}
