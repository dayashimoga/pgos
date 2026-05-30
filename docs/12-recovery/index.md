# 🔄 Recovery & Restoration Guide

## 1. Core Commands
- `guardian snapshot stable` — Creates a tagged, non-volatile state capture.
- `guardian rollback stable` — Automatically rollbacks system state to the stable tag.
- `guardian recover architecture` — Resolves layer drift and illegal circular dependencies.
- `guardian restore auth` — Rolls back authentication states in high-stress outages.

## 2. Recovery Hierarchy
- **L1 (File)**: Recovers isolated file states.
- **L2 (Module)**: Synchronizes whole typescript/python packages.
- **L3 (Feature)**: Restores related feature stories and API controllers.
- **L4 (Architecture)**: Restores layer relationships and configuration matrices.
- **L5 (System)**: Restores total DB clusters, memory networks, and code configurations.
