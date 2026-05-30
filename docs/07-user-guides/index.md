# 🚀 PGOS Local Installation Guide

## 1. Prerequisites
Ensure you have the following installed on your host machine:
- **Docker Desktop** & **docker-compose**
- **Git**
- **Node.js 20+** & **pnpm** (optional, builds run inside transient Docker containers)

## 2. Installation Setup
```bash
# 1. Clone the project
git clone https://github.com/yourorg/pgos.git
cd pgos

# 2. Boot PGOS database and caches
docker-compose up -d

# 3. Bootstrap isolated dependencies
powershell -ExecutionPolicy Bypass -File .\docker-run.ps1 install

# 4. Compile the monorepo inside Docker
powershell -ExecutionPolicy Bypass -File .\docker-run.ps1 build
```

## 3. CLI Command Loop
```bash
guardian init              # Initialize .guardian/ configurations
guardian import project     # Ingest codebase
guardian context build     # Compile project context
guardian snapshot stable   # Create checkpoint snapshot
guardian rollback stable   # Restore snapshot
```
