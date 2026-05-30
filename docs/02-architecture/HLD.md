# 🏢 High-Level Design (HLD)

## High-Level Layer Topology
```
[User Layer (Developer)]
          ↓
[IDE Layer (VS Code / Cursor)]
          ↓
[PGOS Runtime (Intelligent OS Engine)]
          ↓
[Execution Layer (Docker / Process sandbox)]
          ↓
[Persistence Layer (Postgres + ChromaDB)]
```

## Deployment Modes
- **Local Mode**: IDE → PGOS → Ollama → Local PG DB & Vector Cache.
- **Hybrid Mode**: IDE → PGOS → Cloud Model Endpoints → Local Recovery storage.
- **Enterprise Cluster**: Multi-User Gateway → PGOS Cluster → Kubernetes pods → Shared DBs.
