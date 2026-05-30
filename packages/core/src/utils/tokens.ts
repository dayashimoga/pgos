// ============================================================
// @pgos/core — Token Utilities
// Token counting and estimation
// ============================================================

/**
 * Estimate token count for a string.
 * Uses a fast heuristic: ~4 chars per token for English text.
 * For precise counts, use tiktoken or model-specific tokenizers.
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  // Rough estimation: ~4 characters per token for English
  // This is a reasonable approximation for GPT-style models
  return Math.ceil(text.length / 4);
}

/**
 * Estimate token count by word splitting (more accurate for code)
 */
export function estimateTokensByWords(text: string): number {
  if (!text) return 0;
  const words = text.split(/\s+/).filter(Boolean);
  // Code typically has ~1.3 tokens per word due to operators, brackets, etc.
  return Math.ceil(words.length * 1.3);
}

/**
 * Check if content fits within a token budget
 */
export function fitsInBudget(content: string, maxTokens: number): boolean {
  return estimateTokens(content) <= maxTokens;
}

/**
 * Truncate content to fit within a token budget
 */
export function truncateToTokenBudget(content: string, maxTokens: number): string {
  const estimated = estimateTokens(content);
  if (estimated <= maxTokens) return content;

  const ratio = maxTokens / estimated;
  const targetChars = Math.floor(content.length * ratio * 0.95); // 5% safety margin
  return content.slice(0, targetChars) + '\n... [truncated]';
}

/**
 * Calculate token reduction percentage
 */
export function tokenReduction(original: number, optimized: number): number {
  if (original === 0) return 0;
  return Math.round(((original - optimized) / original) * 100);
}

/**
 * Format token count for display
 */
export function formatTokens(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return count.toString();
}
