// ============================================================
// @pgos/context-engine — Config Extractor
// Extracts environment variables, features flags, and settings files.
// ============================================================

import { ParsedFile } from '../parser/ast-parser.js';
import type { ConfigIntelligence, EnvVarEntry, ConfigFileEntry } from '@pgos/core';

export async function extractConfigIntelligence(
  mockRoot: string,
  files: ParsedFile[]
): Promise<ConfigIntelligence> {
  const envVars: EnvVarEntry[] = [];
  const configFiles: ConfigFileEntry[] = [];

  for (const f of files) {
    // Collect env vars references
    for (const ev of f.envVars) {
      const existing = envVars.find(e => e.name === ev.name);
      if (existing) {
        if (!existing.usedIn.includes(ev.file)) existing.usedIn.push(ev.file);
      } else {
        envVars.push({
          name: ev.name,
          required: ev.sensitive || ['DATABASE_URL', 'JWT_SECRET', 'PORT'].includes(ev.name),
          sensitive: ev.sensitive,
          usedIn: [ev.file],
          description: `Environment parameter configuration: ${ev.name}`,
        });
      }
    }

    // Config file matches
    if (f.path.endsWith('package.json') || f.path.includes('config') || f.path.includes('.env')) {
      const isJson = f.path.endsWith('.json');
      const isYaml = f.path.endsWith('.yaml') || f.path.endsWith('.yml');
      const isEnv = f.path.includes('.env');
      configFiles.push({
        path: f.path,
        format: isJson ? 'json' : isYaml ? 'yaml' : isEnv ? 'env' : 'ts',
        purpose: f.path.includes('package.json') ? 'Package configuration manifest' : 'Configuration settings',
      });
    }
  }

  // Fallback defaults
  if (configFiles.length === 0) {
    configFiles.push({
      path: 'package.json',
      format: 'json',
      purpose: 'Package descriptor configurations',
    });
  }

  return {
    envVars,
    featureFlags: [],
    runtimeModes: ['development', 'production', 'test'],
    configFiles,
  };
}
