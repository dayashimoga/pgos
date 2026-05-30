import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/__tests__/**',
        'apps/**',
        'packages/model-adapters/**',
        'packages/doc-engine/src/reports/**',
        'packages/test-engine/src/parser/**',
        'packages/context-engine/src/compiler/context-packager.ts',
        'packages/core/src/utils/**',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
