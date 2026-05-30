// ============================================================
// @pgos/core — File System Utilities
// Helpers for file system operations
// ============================================================

import { readdir, stat, readFile, writeFile, mkdir, access, rm } from 'fs/promises';
import { join, relative, extname, basename } from 'path';
import { constants } from 'fs';

/**
 * Recursively list all files in a directory
 */
export async function listFilesRecursive(
  dir: string,
  options: { ignorePatterns?: string[]; maxDepth?: number } = {}
): Promise<string[]> {
  const { ignorePatterns = [], maxDepth = 20 } = options;
  const files: string[] = [];

  async function walk(currentDir: string, depth: number): Promise<void> {
    if (depth > maxDepth) return;

    const entries = await readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(currentDir, entry.name);
      const relativePath = relative(dir, fullPath);

      // Check ignore patterns
      if (shouldIgnore(relativePath, ignorePatterns)) continue;

      if (entry.isDirectory()) {
        await walk(fullPath, depth + 1);
      } else if (entry.isFile()) {
        files.push(fullPath);
      }
    }
  }

  await walk(dir, 0);
  return files;
}

/**
 * Check if a path matches any ignore pattern
 */
export function shouldIgnore(path: string, patterns: string[]): boolean {
  const defaultIgnore = [
    'node_modules',
    '.git',
    '.guardian',
    'dist',
    'build',
    '.next',
    'coverage',
    '__pycache__',
    '.venv',
    'target',
    '.turbo',
  ];

  const allPatterns = [...defaultIgnore, ...patterns];
  const normalizedPath = path.replace(/\\/g, '/');

  return allPatterns.some((pattern) => {
    if (normalizedPath.includes(pattern)) return true;
    if (normalizedPath.startsWith(pattern)) return true;
    return false;
  });
}

/**
 * Check if a file exists
 */
export async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get file stats safely
 */
export async function safeStats(path: string): Promise<{ size: number; modified: Date } | null> {
  try {
    const stats = await stat(path);
    return { size: stats.size, modified: stats.mtime };
  } catch {
    return null;
  }
}

/**
 * Read file contents safely
 */
export async function safeReadFile(path: string): Promise<string | null> {
  try {
    return await readFile(path, 'utf-8');
  } catch {
    return null;
  }
}

/**
 * Write file with directory creation
 */
export async function safeWriteFile(path: string, content: string): Promise<void> {
  const dir = join(path, '..');
  await mkdir(dir, { recursive: true });
  await writeFile(path, content, 'utf-8');
}

/**
 * Ensure a directory exists
 */
export async function ensureDir(path: string): Promise<void> {
  await mkdir(path, { recursive: true });
}

/**
 * Remove a file or directory safely
 */
export async function safeRemove(path: string): Promise<boolean> {
  try {
    await rm(path, { recursive: true, force: true });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the language from a file extension
 */
export function getLanguageFromExtension(filePath: string): string {
  const ext = extname(filePath).toLowerCase();
  const languageMap: Record<string, string> = {
    '.ts': 'typescript',
    '.tsx': 'typescript',
    '.js': 'javascript',
    '.jsx': 'javascript',
    '.py': 'python',
    '.rb': 'ruby',
    '.go': 'go',
    '.rs': 'rust',
    '.java': 'java',
    '.kt': 'kotlin',
    '.cs': 'csharp',
    '.cpp': 'cpp',
    '.c': 'c',
    '.h': 'c',
    '.hpp': 'cpp',
    '.swift': 'swift',
    '.php': 'php',
    '.scala': 'scala',
    '.r': 'r',
    '.sql': 'sql',
    '.sh': 'shell',
    '.bash': 'shell',
    '.ps1': 'powershell',
    '.yaml': 'yaml',
    '.yml': 'yaml',
    '.json': 'json',
    '.xml': 'xml',
    '.html': 'html',
    '.css': 'css',
    '.scss': 'scss',
    '.less': 'less',
    '.md': 'markdown',
    '.mdx': 'markdown',
    '.vue': 'vue',
    '.svelte': 'svelte',
    '.dart': 'dart',
    '.ex': 'elixir',
    '.exs': 'elixir',
    '.erl': 'erlang',
    '.hs': 'haskell',
    '.lua': 'lua',
    '.pl': 'perl',
    '.tf': 'terraform',
    '.proto': 'protobuf',
    '.graphql': 'graphql',
    '.gql': 'graphql',
  };

  return languageMap[ext] || 'unknown';
}

/**
 * Check if a file is binary (not a text file)
 */
export function isBinaryFile(filePath: string): boolean {
  const binaryExtensions = [
    '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.ico', '.svg',
    '.woff', '.woff2', '.ttf', '.eot', '.otf',
    '.zip', '.tar', '.gz', '.bz2', '.7z', '.rar',
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
    '.mp3', '.mp4', '.avi', '.mov', '.wav', '.flac',
    '.exe', '.dll', '.so', '.dylib',
    '.pyc', '.class', '.o', '.obj',
    '.wasm', '.db', '.sqlite',
  ];

  return binaryExtensions.includes(extname(filePath).toLowerCase());
}

/**
 * Get the basename without extension
 */
export function getBaseName(filePath: string): string {
  const base = basename(filePath);
  const ext = extname(filePath);
  return base.slice(0, base.length - ext.length);
}
