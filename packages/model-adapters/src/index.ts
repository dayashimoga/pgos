// ============================================================
// @pgos/model-adapters — Adapter Registry
// Central registry for model adapters
// ============================================================

import { type ModelAdapter, type ModelConfig, type ModelProvider, componentLogger } from '@pgos/core';
import { OpenAIAdapter } from './openai/adapter.js';
import { AnthropicAdapter } from './anthropic/adapter.js';
import { OllamaAdapter } from './ollama/adapter.js';

const log = componentLogger('adapter-registry');

/**
 * Create a model adapter based on provider configuration
 */
export function createAdapter(config: ModelConfig): ModelAdapter {
  log.info({ provider: config.provider, model: config.model }, 'Creating model adapter');

  switch (config.provider) {
    case 'openai':
      return new OpenAIAdapter(config);

    case 'anthropic':
      return new AnthropicAdapter(config);

    case 'ollama':
      return new OllamaAdapter(config);

    case 'gemini':
      // Use OpenAI-compatible API for Gemini via Google's endpoint
      return new OpenAIAdapter({
        ...config,
        baseUrl: config.baseUrl || 'https://generativelanguage.googleapis.com/v1beta/openai',
      });

    case 'vllm':
      // vLLM exposes an OpenAI-compatible API
      return new OpenAIAdapter({
        ...config,
        baseUrl: config.baseUrl || 'http://localhost:8000/v1',
      });

    case 'lmstudio':
      // LM Studio exposes an OpenAI-compatible API
      return new OpenAIAdapter({
        ...config,
        baseUrl: config.baseUrl || 'http://localhost:1234/v1',
        apiKey: config.apiKey || 'lm-studio',
      });

    case 'custom':
      // Default to OpenAI-compatible format
      return new OpenAIAdapter(config);

    default:
      throw new Error(`Unsupported model provider: ${config.provider}`);
  }
}

/**
 * Get a list of supported providers
 */
export function getSupportedProviders(): { provider: ModelProvider; name: string; type: 'cloud' | 'local' }[] {
  return [
    { provider: 'openai', name: 'OpenAI', type: 'cloud' },
    { provider: 'anthropic', name: 'Anthropic', type: 'cloud' },
    { provider: 'gemini', name: 'Google Gemini', type: 'cloud' },
    { provider: 'ollama', name: 'Ollama', type: 'local' },
    { provider: 'vllm', name: 'vLLM', type: 'local' },
    { provider: 'lmstudio', name: 'LM Studio', type: 'local' },
    { provider: 'custom', name: 'Custom Endpoint', type: 'cloud' },
  ];
}

/**
 * Validate that a provider configuration is valid
 */
export function validateConfig(config: ModelConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.provider) errors.push('Provider is required');
  if (!config.model) errors.push('Model name is required');

  const cloudProviders: ModelProvider[] = ['openai', 'anthropic', 'gemini'];
  if (cloudProviders.includes(config.provider) && !config.apiKey) {
    errors.push(`API key is required for ${config.provider}`);
  }

  if (config.temperature !== undefined && (config.temperature < 0 || config.temperature > 2)) {
    errors.push('Temperature must be between 0 and 2');
  }

  if (config.maxTokens !== undefined && config.maxTokens < 1) {
    errors.push('Max tokens must be a positive number');
  }

  return { valid: errors.length === 0, errors };
}
