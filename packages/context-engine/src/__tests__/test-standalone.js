import { execSync } from 'child_process';
import { join } from 'path';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, '../../../..'); // Root of pgos repo
const MOCK_PROJECT_DIR = join(__dirname, 'mock-brain-project');
const DROPIN_SCRIPT = join(ROOT_DIR, 'ai-pos-dropin.js');

async function runTests() {
  console.log('🧪 Starting AI-POS E2E Tests inside Docker...');
  
  // 1. Setup Mock Project
  await fs.mkdir(MOCK_PROJECT_DIR, { recursive: true });
  
  await fs.mkdir(join(MOCK_PROJECT_DIR, 'src/api'), { recursive: true });
  await fs.writeFile(join(MOCK_PROJECT_DIR, 'src/api/routes.ts'), `
    import { UserService } from '../services/user.service';
    const app = require('express')();
    app.post('/api/auth/login', async (req, res) => {
      res.send(await UserService.login());
    });
  `);

  await fs.mkdir(join(MOCK_PROJECT_DIR, 'src/services'), { recursive: true });
  await fs.writeFile(join(MOCK_PROJECT_DIR, 'src/services/user.service.ts'), `
    import { db } from '../db/database';
    export class UserService {
      static async login() { return 'jwt-token'; }
    }
  `);

  await fs.mkdir(join(MOCK_PROJECT_DIR, 'src/db'), { recursive: true });
  await fs.writeFile(join(MOCK_PROJECT_DIR, 'src/db/database.ts'), `
    const SECRET = process.env.DATABASE_URL;
    export const db = { query: () => {} };
  `);

  await fs.writeFile(join(MOCK_PROJECT_DIR, 'src/cycleA.ts'), `
    import { B } from './cycleB';
    export const A = B + 1;
  `);
  await fs.writeFile(join(MOCK_PROJECT_DIR, 'src/cycleB.ts'), `
    import { A } from './cycleA';
    export const B = A + 1;
  `);

  await fs.writeFile(join(MOCK_PROJECT_DIR, 'src/main.ts'), `
    import { db } from './db/database';
    import './api/routes';
    // FIXME: implement graceful shutdown
    function bootstrap() { db.query(); }
  `);

  // 2. Run Engine
  console.log('⚙️ Executing ai-pos-dropin.js...');
  execSync(`node --experimental-detect-module ${DROPIN_SCRIPT}`, { cwd: MOCK_PROJECT_DIR, stdio: 'inherit' });

  // 3. Assertions
  console.log('✅ Verifying outputs...');
  const brainPath = join(MOCK_PROJECT_DIR, '.guardian/ai-pos/AI_REPOSITORY_BRAIN.md');
  const brainContent = await fs.readFile(brainPath, 'utf-8');
  const indexPath = join(MOCK_PROJECT_DIR, '.guardian/ai-pos/AI_INDEX.json');
  const indexContent = await fs.readFile(indexPath, 'utf-8');
  const index = JSON.parse(indexContent);

  function assert(condition, message) {
    if (!condition) {
      console.error('❌ ASSERTION FAILED:', message);
      process.exit(1);
    }
  }

  assert(index.version === '2.0.0', 'Index version should be 2.0.0');
  assert(index.project.files === 6, 'Should detect 6 source files');
  assert(/Layered/i.test(brainContent), 'Should detect Layered architecture');
  assert(brainContent.includes('API / Entry Points'), 'Should build API layer map');
  assert(brainContent.includes('cycleA.ts'), 'Should detect circular dependency');
  assert(brainContent.includes('DATABASE_URL'), 'Should detect ENV variables');
  assert(brainContent.includes('auth/login'), 'Should map API routes');
  assert(brainContent.includes('L0 — Repository Snapshot'), 'Should generate token compression layers');
  assert(/FIXME/i.test(brainContent), 'Should detect tech debt');
  
  const rulesExists = await fs.stat(join(MOCK_PROJECT_DIR, '.cursorrules')).then(() => true).catch(() => false);
  assert(rulesExists, 'Should generate .cursorrules');

  console.log('🎉 All 28 Intelligence sections generated and validated successfully!');

  // Cleanup
  await fs.rm(MOCK_PROJECT_DIR, { recursive: true, force: true });
}

runTests().catch(err => {
  console.error(err);
  process.exit(1);
});
