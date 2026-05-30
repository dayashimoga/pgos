import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'child_process';
import { join } from 'path';
import { promises as fs } from 'fs';

const ROOT_DIR = join(__dirname, '../../../..'); // Root of pgos repo
const MOCK_PROJECT_DIR = join(__dirname, 'mock-brain-project');
const DROPIN_SCRIPT = join(ROOT_DIR, 'ai-pos-dropin.js');

describe('AI-POS Brain Generator Engine (End-to-End)', () => {
  beforeAll(async () => {
    // 1. Setup a complex mock project structure to trigger various analyzers
    await fs.mkdir(MOCK_PROJECT_DIR, { recursive: true });
    
    // API Layer
    await fs.mkdir(join(MOCK_PROJECT_DIR, 'src/api'), { recursive: true });
    await fs.writeFile(join(MOCK_PROJECT_DIR, 'src/api/routes.ts'), `
      import { UserService } from '../services/user.service';
      import express from 'express';
      const app = express();
      
      // Critical route
      app.post('/api/auth/login', async (req, res) => {
        const token = await UserService.login(req.body);
        res.send(token);
      });
      
      app.get('/api/users', (req, res) => {
        // TODO: add pagination
        res.send([]);
      });
    `);

    // Services Layer
    await fs.mkdir(join(MOCK_PROJECT_DIR, 'src/services'), { recursive: true });
    await fs.writeFile(join(MOCK_PROJECT_DIR, 'src/services/user.service.ts'), `
      import { db } from '../db/database';
      export class UserService {
        static async login(creds) {
          // FIXME: hash passwords properly
          return 'jwt-token';
        }
      }
    `);

    // DB / Infrastructure Layer
    await fs.mkdir(join(MOCK_PROJECT_DIR, 'src/db'), { recursive: true });
    await fs.writeFile(join(MOCK_PROJECT_DIR, 'src/db/database.ts'), `
      const SECRET = process.env.DATABASE_URL;
      export const db = {
        query: () => {}
      };
    `);

    // Tests (to prove safe zone and coverage mapping)
    await fs.mkdir(join(MOCK_PROJECT_DIR, 'src/api/__tests__'), { recursive: true });
    await fs.writeFile(join(MOCK_PROJECT_DIR, 'src/api/__tests__/routes.test.ts'), `
      import { test } from 'vitest';
      import '../routes';
      test('login works', () => { /* test */ });
    `);

    // Circular Dependency (to prove cyclic detection)
    await fs.writeFile(join(MOCK_PROJECT_DIR, 'src/cycleA.ts'), `
      import { B } from './cycleB';
      export const A = B + 1;
    `);
    await fs.writeFile(join(MOCK_PROJECT_DIR, 'src/cycleB.ts'), `
      import { A } from './cycleA';
      export const B = A + 1;
    `);

    // Entry point (to prove startup execution flows)
    await fs.writeFile(join(MOCK_PROJECT_DIR, 'src/main.ts'), `
      import { db } from './db/database';
      import './api/routes';
      import 'pino'; // Observability test
      
      function bootstrap() {
        db.query();
        app.listen(3000);
      }
      bootstrap();
    `);

    // 2. Run the drop-in script against the mock project
    try {
      execSync(`node ${DROPIN_SCRIPT}`, { cwd: MOCK_PROJECT_DIR, stdio: 'inherit' });
    } catch (e) {
      console.error('Failed to run dropin script:', e);
      throw e;
    }
  });

  afterAll(async () => {
    // Cleanup mock project
    await fs.rm(MOCK_PROJECT_DIR, { recursive: true, force: true });
  });

  it('should generate the master AI_REPOSITORY_BRAIN.md file', async () => {
    const brainPath = join(MOCK_PROJECT_DIR, '.guardian/ai-pos/AI_REPOSITORY_BRAIN.md');
    const exists = await fs.stat(brainPath).then(() => true).catch(() => false);
    expect(exists).toBe(true);
  });

  it('should generate the AI_INDEX.json machine-readable index', async () => {
    const indexPath = join(MOCK_PROJECT_DIR, '.guardian/ai-pos/AI_INDEX.json');
    const indexContent = await fs.readFile(indexPath, 'utf-8');
    const index = JSON.parse(indexContent);
    
    expect(index.version).toBe('2.0.0');
    expect(index.project.files).toBeGreaterThan(5);
    expect(index.endpoints).toBeGreaterThan(0);
    expect(index.risk).toBeGreaterThan(0);
  });

  it('should detect the Layered architecture and extract routes', async () => {
    const brainPath = join(MOCK_PROJECT_DIR, '.guardian/ai-pos/AI_REPOSITORY_BRAIN.md');
    const brainContent = await fs.readFile(brainPath, 'utf-8');
    
    // Architecture
    expect(brainContent).toContain('Layered');
    expect(brainContent).toContain('API / Entry Points');
    expect(brainContent).toContain('Services / Business Logic');
    
    // Endpoints
    expect(brainContent).toContain('POST');
    expect(brainContent).toContain('/api/auth/login');
  });

  it('should detect tech debt, stubs, and circular dependencies', async () => {
    const brainPath = join(MOCK_PROJECT_DIR, '.guardian/ai-pos/AI_REPOSITORY_BRAIN.md');
    const brainContent = await fs.readFile(brainPath, 'utf-8');
    
    // Circular dependencies
    expect(brainContent).toContain('cycleA.ts');
    expect(brainContent).toContain('cycleB.ts');
    
    // Debt & Stubs
    expect(brainContent).toContain('TODO');
    expect(brainContent).toContain('add pagination');
    expect(brainContent).toContain('FIXME');
    expect(brainContent).toContain('hash passwords');
  });

  it('should detect security and env variables', async () => {
    const brainPath = join(MOCK_PROJECT_DIR, '.guardian/ai-pos/AI_REPOSITORY_BRAIN.md');
    const brainContent = await fs.readFile(brainPath, 'utf-8');
    
    // Env vars
    expect(brainContent).toContain('DATABASE_URL');
    expect(brainContent).toContain('YES'); // Sensitive flag
    
    // Security Boundaries
    expect(brainContent).toContain('auth/login');
  });

  it('should generate token optimization layers (L0-L6)', async () => {
    const brainPath = join(MOCK_PROJECT_DIR, '.guardian/ai-pos/AI_REPOSITORY_BRAIN.md');
    const brainContent = await fs.readFile(brainPath, 'utf-8');
    
    expect(brainContent).toContain('L0 — Repository Snapshot');
    expect(brainContent).toContain('L1 — Architecture Summary');
    expect(brainContent).toContain('L4 — Module Summary');
  });

  it('should output AI context rules for IDEs', async () => {
    const cursorRules = await fs.stat(join(MOCK_PROJECT_DIR, '.cursorrules')).then(() => true).catch(() => false);
    const windsurfRules = await fs.stat(join(MOCK_PROJECT_DIR, '.windsurfrules')).then(() => true).catch(() => false);
    const copilotRules = await fs.stat(join(MOCK_PROJECT_DIR, '.github/copilot-instructions.md')).then(() => true).catch(() => false);
    
    expect(cursorRules).toBe(true);
    expect(windsurfRules).toBe(true);
    expect(copilotRules).toBe(true);
  });
});
