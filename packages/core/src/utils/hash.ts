// ============================================================
// @pgos/core — Hash Utilities
// Content hashing for integrity checking
// ============================================================

import { createHash, randomUUID } from 'crypto';

/**
 * Generate a SHA-256 hash of content
 */
export function sha256(content: string | Buffer): string {
  return createHash('sha256').update(content).digest('hex');
}

/**
 * Generate a short hash (first 12 chars of SHA-256)
 */
export function shortHash(content: string | Buffer): string {
  return sha256(content).slice(0, 12);
}

/**
 * Generate a UUID v4
 */
export function generateId(): string {
  return randomUUID();
}

/**
 * Generate a slug from a string
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Generate a fingerprint for a set of files (sorted hashes)
 */
export function fingerprint(hashes: string[]): string {
  const sorted = [...hashes].sort();
  return sha256(sorted.join(':'));
}
