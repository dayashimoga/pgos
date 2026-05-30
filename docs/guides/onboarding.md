# ⚡ PGOS Onboarding & Developer Manual

Welcome to **Project Guardian OS (PGOS)**! This onboarding guide is designed to get you from a fresh clone to building, validating, and managing AI-assisted code loops in less than 30 minutes.

---

## 🏗️ Core Architecture Overview

PGOS operates at the intersection of your workspace, local/remote AI model APIs, and Git:

```
      +-------------------------------------------+
      |               Next.js UI                  |
      +-------------------------------------------+
                            | (WebSocket / REST)
                            v
      +-------------------------------------------+
      |           Fastify API Gateway             |
      +-------------------------------------------+
        |                 |                 |
        v                 v                 v
 +-------------+   +-------------+   +-------------+
 | Context OS  |   | Validation  |   | Recovery    |
 +-------------+   +-------------+   +-------------+
        |                 |                 |
        +--------+--------+-----------------+
                 |
                 v
   +-----------------------------+
   | PostgreSQL + ChromaDB Vector|
   +-----------------------------+
```

---

## 🛠️ Onboarding Instructions

### Option A: Zero-Install Universal Client Script (Recommended)
This is the **easiest and fastest way** to integrate PGOS into *any* existing or brand-new project. 

1. Simply copy the `pgos.ps1` (for Windows) or `pgos.sh` (for macOS/Linux) script into the root directory of your project.
2. Ensure Docker Desktop is active on your host.
3. Instantly run any core PGOS engine command without configuring workspaces locally:
   ```powershell
   # Windows
   .\pgos.ps1 init        # Scaffolds .guardian rules in your project
   .\pgos.ps1 validate    # Scours codebase for stubs & fake APIs
   .\pgos.ps1 context     # Compiles optimized L0-L4 context package
   .\pgos.ps1 docs        # Synthesizes 20-folder master document sets
   .\pgos.ps1 snapshot    # Captures current project checkpoint
   ```
   ```bash
   # Unix/macOS
   chmod +x pgos.sh
   ./pgos.sh init
   ./pgos.sh validate
   ./pgos.sh docs
   ```

---

### Option B: Monorepo Isolated Docker Bootstrap (Standard)
We enforce a host-clean policy. Run all monorepo symlinks and compiles inside our transient Docker container:
```powershell
# 1. Setup workspace symlinks and dependencies
powershell -ExecutionPolicy Bypass -File .\docker-run.ps1 install

# 2. Compile all 18 monorepo targets and static pages
powershell -ExecutionPolicy Bypass -File .\docker-run.ps1 build
```

### Step 2: Run Database & Event Infras
Spin up Postgres, Redis, and ChromaDB vector engines in the background:
```bash
docker-compose up -d
```

### Step 3: Boot PGOS API & Web Dashboard
Attach dev containers or start the fastify server and Next.js React Dashboard:
```bash
# Start API (Port 3001)
pnpm --filter @pgos/api dev

# Start Dashboard (Port 3000)
pnpm --filter @pgos/dashboard dev
```

---

## 📁 CLI Commands & Operational Playbook

Use the `guardian` CLI commands to perform everyday developer loops:

```bash
# Initialize PGOS on a repository
pnpm run guardian -- init

# Index files, generate AST hashes, cache in ChromaDB
pnpm --filter @pgos/cli start -- ingest --root-path /path/to/project

# Check completeness, stubs, and API hallucinations
pnpm run guardian -- validate --root-path /path/to/project

# Create checkpoint snapshot before prompt injections
pnpm run guardian -- snapshot create --label pre-ai

# Rollback project to stable checkpoint
pnpm run guardian -- recovery rollback --snapshot-id <id>
```

Enjoy vibe coding with zero context loss, zero stubs, and absolute architectural peace of mind!
