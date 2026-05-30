# ⚡ Project Guardian OS (PGOS)

> AI-native project runtime, validation, portability, recovery, context, and quality operating system for AI-assisted software development.

<p align="center">
  <strong>Context Engine</strong> · <strong>Model Portability</strong> · <strong>Snapshot & Recovery</strong> · <strong>Validation</strong> · <strong>Architecture Guard</strong> · <strong>Hallucination Detection</strong>
</p>

---

## What is PGOS?

PGOS sits between your IDE, AI models, repositories, and CI/CD pipelines to solve critical problems in AI-assisted development:

- 🧠 **Context Engine** — Eliminate repeated prompts. 500K tokens → <50K active context
- 🔄 **Model Portability** — Switch between OpenAI, Anthropic, Gemini, Ollama without losing memory
- 📸 **Snapshot & Recovery** — Automatic snapshots before every AI action. One-click rollback
- ✅ **Validation Engine** — Detect false "completed" claims, TODOs, stubs, and mock logic
- 🏗️ **Architecture Guard** — Prevent AI from corrupting your architecture or deleting critical components
- 🔍 **Hallucination Detector** — Catch fake imports, nonexistent APIs, and hallucinated dependencies
- 📊 **Observability** — Track token efficiency, AI quality, costs, and project health

## Quick Start

```bash
# Clone the repository
git clone https://github.com/yourorg/pgos.git
cd pgos

# Install dependencies
pnpm install

# Start infrastructure (PostgreSQL, Redis, ChromaDB)
docker-compose up -d

# Copy environment config
cp .env.example .env

# Build all packages
pnpm build

# Start the API server
pnpm --filter @pgos/api dev

# Start the dashboard (in another terminal)
pnpm --filter @pgos/dashboard dev

# Or use the CLI
pnpm --filter @pgos/cli dev -- init
pnpm --filter @pgos/cli dev -- context compile
pnpm --filter @pgos/cli dev -- validate
```

## Architecture

```
PGOS
├── packages/
│   ├── core/                    # Shared types, utils, constants
│   ├── context-engine/          # Universal context compilation
│   ├── model-adapters/          # OpenAI, Anthropic, Gemini, Ollama adapters
│   ├── recovery-engine/         # Snapshot & recovery
│   ├── validation-engine/       # Completion validation
│   ├── hallucination-detector/  # Hallucinated code detection
│   ├── architecture-guard/      # Architecture protection
│   └── observability/           # Metrics & telemetry
│
├── apps/
│   ├── api/                     # Fastify REST API server
│   ├── cli/                     # Guardian CLI tool
│   └── dashboard/               # Next.js web dashboard
│
└── infra/                       # Docker, K8s, CI/CD
```

## CLI Commands

| Command | Description |
|---------|-------------|
| `guardian init` | Initialize PGOS for a project |
| `guardian context compile` | Compile project context |
| `guardian context export` | Export context for AI model |
| `guardian snapshot stable` | Create a stable snapshot |
| `guardian snapshot list` | List all snapshots |
| `guardian validate` | Run full validation suite |
| `guardian validate --completion` | Check completion only |
| `guardian validate --hallucination` | Detect hallucinations |
| `guardian status` | Show project health |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/projects` | Create project |
| POST | `/api/v1/projects/:id/ingest` | Ingest project |
| POST | `/api/v1/projects/:id/context/compile` | Compile context |
| POST | `/api/v1/projects/:id/context/export` | Export for model |
| POST | `/api/v1/projects/:id/snapshots` | Create snapshot |
| POST | `/api/v1/projects/:id/validate` | Run validations |
| POST | `/api/v1/projects/:id/recovery/rollback` | Rollback |
| GET | `/api/v1/system/health` | System health |

## Tech Stack

- **Runtime**: Node.js 20+ / TypeScript
- **Monorepo**: pnpm workspaces + Turborepo
- **API**: Fastify 5
- **Dashboard**: Next.js 14 + React 18
- **Database**: PostgreSQL 16 (pgvector)
- **Cache**: Redis 7
- **Vector DB**: ChromaDB
- **CI/CD**: GitHub Actions

---

## ⚡ Adoption & Usage Guide

PGOS is highly flexible and can be adopted instantly for either existing enterprise repositories or brand new codebases.

### 1. Integrating PGOS into an Existing Project
To inject context-awareness, validation checks, and automatic documentation into your existing project:
1. **Initialize PGOS**:
   ```bash
   pnpm run guardian -- init
   ```
   This scaffolds the `.guardian/` configuration directories in your project root, creating default rules for context collection, code architecture, and validation checks.
2. **Ingest the codebase**:
   ```bash
   # Run full parser static indexation
   pnpm --filter @pgos/cli start -- ingest --root-path /path/to/your/project
   ```
   This parses files, compiles the dependency graph, and caches structural AST fingerprints inside ChromaDB.
3. **Compile and Export optimized L0-L4 Context**:
   ```bash
   # Compile active state
   pnpm run guardian -- context compile
   # Export optimized model prompt
   pnpm run guardian -- context export --model gemini-1.5-pro
   ```
4. **Audit and Validate code changes**:
   ```bash
   pnpm run guardian -- validate --root-path /path/to/your/project
   ```

### 2. Bootstrapping PGOS for a New Project
To start a brand new project using PGOS context constraints:
1. **Template generation**:
   ```bash
   # Scaffolds new directory with base TS config and structural layers
   pnpm run guardian -- init --new my-new-application
   ```
2. **Define layer bounds**:
   Configure `my-new-application/.guardian/architecture.json` to outline layer limits:
   ```json
   {
     "layers": ["L1-UI", "L2-API", "L3-Service", "L4-Database"],
     "forbiddenDirectAccess": [
       { "source": "L1-UI", "target": "L4-Database" }
     ]
   }
   ```
3. **Continuous development**:
   Use `docker-run.ps1` to run all compile and check hooks. Documentation, validation scores, and unit asserts will update on save.

---

## 🧹 Host-Clean Docker dev operations
All builds and workspace commands can be run seamlessly inside a transient Docker container:
```powershell
# Setup all symlinks and packages
powershell -ExecutionPolicy Bypass -File .\docker-run.ps1 install

# Compile workspace and Next.js static layouts
powershell -ExecutionPolicy Bypass -File .\docker-run.ps1 build

# Reclaim disk space and prune Node base builder caches
powershell -ExecutionPolicy Bypass -File .\docker-run.ps1 clean-images
```

## License

MIT

