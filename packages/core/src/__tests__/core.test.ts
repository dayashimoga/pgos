import { describe, it, expect, afterAll } from 'vitest';
import { sha256, estimateTokens, listFilesRecursive, isBinaryFile, fileExists, safeReadFile } from '../index.js';
import { join, dirname } from 'path';
import { mkdir, writeFile, rm } from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('PGOS Core Utilities', () => {
  const mockRoot = join(__dirname, 'mock-project-core');

  afterAll(async () => {
    await rm(mockRoot, { recursive: true, force: true });
  });

  describe('hash', () => {
    it('should generate consistent sha256 hashes', () => {
      const hash1 = sha256('hello world');
      const hash2 = sha256('hello world');
      const hash3 = sha256('different');
      
      expect(hash1).toBe(hash2);
      expect(hash1).not.toBe(hash3);
      expect(hash1.length).toBe(64); // Hex string length
    });
  });

  describe('tokens', () => {
    it('should estimate token count correctly', () => {
      const text = 'This is a sample text for token estimation.';
      const count = estimateTokens(text);
      
      // Typical estimation is around text.length / 4
      expect(count).toBeGreaterThan(5);
      expect(count).toBeLessThan(20);
    });
  });

  describe('fs', () => {
    it('should list files recursively respecting ignore patterns', async () => {
      await mkdir(join(mockRoot, 'src'), { recursive: true });
      await mkdir(join(mockRoot, 'node_modules'), { recursive: true });
      
      await writeFile(join(mockRoot, 'src', 'a.ts'), '');
      await writeFile(join(mockRoot, 'src', 'b.ts'), '');
      await writeFile(join(mockRoot, 'node_modules', 'c.ts'), '');
      
      const files = await listFilesRecursive(mockRoot);
      
      expect(files.length).toBe(2);
      expect(files.some(f => f.includes('node_modules'))).toBe(false);
    });

    it('should correctly identify binary files', () => {
      expect(isBinaryFile('image.png')).toBe(true);
      expect(isBinaryFile('archive.zip')).toBe(true);
      expect(isBinaryFile('document.pdf')).toBe(true);
      
      expect(isBinaryFile('script.ts')).toBe(false);
      expect(isBinaryFile('style.css')).toBe(false);
      expect(isBinaryFile('data.json')).toBe(false);
    });

    it('should check if file exists safely', async () => {
      await mkdir(mockRoot, { recursive: true });
      await writeFile(join(mockRoot, 'exists.txt'), 'data');
      
      expect(await fileExists(join(mockRoot, 'exists.txt'))).toBe(true);
      expect(await fileExists(join(mockRoot, 'nonexistent.txt'))).toBe(false);
    });

    it('should read file safely', async () => {
      await mkdir(mockRoot, { recursive: true });
      await writeFile(join(mockRoot, 'safe.txt'), 'hello');
      
      expect(await safeReadFile(join(mockRoot, 'safe.txt'))).toBe('hello');
      expect(await safeReadFile(join(mockRoot, 'nonexistent.txt'))).toBeNull();
    });
  });
});
