# AIRB v3.0 — AI Repository Brain Platform Upgrade

Upgrade `ai-pos-dropin.js` from a Brain Generator (v2.0) to a full **AI Repository Brain Platform** (v3.0) as specified in the AIRB requirements document.

## Gap Analysis: Current v2.0 vs. AIRB Requirements

The current engine covers the structural skeleton of 28 sections but falls short in **depth of semantic inference**. Below is the section-by-section gap analysis.

### Sections That Need Major Enhancement

| § | Section | Current State | AIRB Requirement | Gap |
|---|---------|---------------|------------------|-----|
| 1 | Project Identity | ✅ Basic metadata | Business purpose, goals, non-goals, executive summary, strategic priorities | **Add** goals/non-goals inference, deployment model, development phase |
| 2 | Domain Intelligence | ❌ Missing | Full domain glossary, entity relationships, business capabilities, lifecycle diagrams | **NEW** — Build `buildDomainIntelligence()` analyzer |
| 4 | Knowledge Graph | ❌ Missing (only module grouping) | Full semantic knowledge graph: modules → features → functions → events → state → APIs | **NEW** — Build `buildKnowledgeGraph()` |
| 5 | Feature Intelligence | ⚠️ Shallow (treats dirs as features) | Never treat files as features. Infer real features with business value, entrypoints, deps | **Rewrite** `buildFeatureMatrix()` to infer semantic features |
| 6 | Function Intelligence | ❌ Missing | Per-function: purpose, inputs, outputs, called-by, calls, side effects, state reads/writes | **NEW** — Build `buildFunctionIntelligence()` |
| 7 | Execution Intelligence | ⚠️ Template-based | Real request tracing: POST /login → AuthRoute → AuthService → UserRepo → DB → JWT → Response | **Enhance** `buildExecutionFlows()` with actual import tracing |
| 12 | Data Intelligence | ❌ Missing | Database models, tables, indexes, migrations, repositories, data flows, data ownership | **NEW** — Build `buildDataIntelligence()` |
| 13 | Configuration | ⚠️ Env vars only | Feature flags, profiles, secrets, runtime modes, startup config, detection of unsafe defaults | **Enhance** to detect hardcoded values, missing configs |
| 14 | Test Intelligence | ⚠️ Count-based | Risk-based testing matrix, runtime path test map, regression risk analysis | **Enhance** with path-based coverage mapping |
| 15 | Change Impact | ✅ Good foundation | Add affected features, affected runtime paths, rollback strategy | **Enhance** blast radius with feature/runtime mapping |
| 20 | Tech Debt | ⚠️ TODO/FIXME only | Dead code, unused code, deprecated code, partial implementations with priority/impact/effort | **Enhance** with dead code detection improvements |
| 21 | Project Memory | ⚠️ Placeholder | Persist decisions, lessons, roadmap, active work, rejected approaches | **Enhance** to read existing brain and merge history |
| 28 | Adoption & Usability | ❌ Missing | Onboarding guidance, AI usage guidance, human usage guidance, CI/CD integration | **NEW** — Add onboarding section |

### Sections That Are Adequate (Minor Polish)

| § | Section | Status |
|---|---------|--------|
| 3 | Architecture | ✅ Good — Add architecture decisions, risks, and narrative |
| 8 | State Intelligence | ✅ Good — Enhance with persistence and synchronization |
| 9 | Event Intelligence | ✅ Good — Add dead/unused event detection |
| 10 | Dependency Intelligence | ✅ Strong — Add service graph |
| 11 | API & Contracts | ✅ Good — Add contract drift, missing validation, breaking change detection |
| 16 | Risk Intelligence | ✅ Good — Add operational/reliability risks |
| 17 | Performance | ✅ Good — Add CPU/memory/latency specifics |
| 18 | Observability | ✅ Good — Add alerting detection |
| 19 | Security | ✅ Good — Add credential flow and validation gaps |
| 22 | AI Operating Rules | ✅ Good — Add DO NOT MODIFY zones |
| 23 | Navigation Engine | ✅ Good — Add task-based navigation ("Need Auth? → S19") |
| 24 | Token Compression | ✅ Good — Ensure L0-L6 are truly semantic, not shallow |
| 25 | False Generation Prevention | ✅ Good — Add runtime reachability check |
| 26 | Validation Engine | ✅ Good — Add staleness detection |
| 27 | Visualization | ✅ Good — Add event, state, knowledge graph diagrams |
| 28 | Quality Manifest | ✅ Good — Expand checks |

---

## Proposed Changes

### Phase 1: New Analyzers (Core Intelligence Upgrade)

> [!IMPORTANT]
> These are the most critical additions. They transform AIRB from a "smart file scanner" into a "repository intelligence platform."

#### [MODIFY] [ai-pos-dropin.js](file:///h:/pgos/ai-pos-dropin.js)

**1a. Domain Intelligence Analyzer** — `buildDomainIntelligence(files, arch)`
- Infer business entities from class names, interfaces, and model files
- Build entity relationships from imports and type references  
- Generate business capability map from directory/feature grouping
- Detect domain processes from function names (create, update, delete, validate, process)
- Build a domain glossary from unique business terms

**1b. Knowledge Graph Builder** — `buildKnowledgeGraph(files, depGraph, callGraph, features, events)`
- Map: Module → Feature → Service → Class → Function → Event → State → API
- Generate cross-module relationship edges
- Build ownership graph (which module owns which capability)
- Output as structured data for Mermaid visualization

**1c. Function Intelligence Analyzer** — `buildFunctionIntelligence(files, callGraph, depGraph)`
- For every exported/important function: infer purpose, inputs, outputs
- Trace "called by" and "calls" relationships from the call graph
- Detect side effects: state writes, event emissions, DB operations, HTTP calls
- Classify: pure, side-effect, async, entry-point, handler, utility

**1d. Data Intelligence Analyzer** — `buildDataIntelligence(files)`
- Detect database models from ORM patterns (Prisma, Drizzle, TypeORM, Mongoose, Sequelize)
- Extract table/collection names from schema files
- Detect migration files and track migration history
- Map repository/DAO files to their data entities
- Build data flow: Which services read/write which entities

---

### Phase 2: Enhanced Existing Analyzers

#### [MODIFY] [ai-pos-dropin.js](file:///h:/pgos/ai-pos-dropin.js)

**2a. Enhanced Project Identity (S1)**
- Add: Business purpose (inferred from domain + README), development phase, deployment model
- Add: Goals / Non-Goals / Success Metrics (template with smart defaults)
- Add: Executive Summary (2-3 sentence compressed summary)

**2b. Enhanced Feature Intelligence (S5 → S8 in current)**
- Rewrite `buildFeatureMatrix()` to infer real features from:
  - Route groups + their service handlers
  - Event publisher/subscriber pairs
  - Domain entity CRUD operations
- Never treat raw files/directories as features

**2c. Enhanced Execution Intelligence (S7 → S6 in current)**
- Trace actual request paths: Route file → imported service → imported repository → DB
- Build per-endpoint execution chains using import graph traversal
- Generate Mermaid sequence diagrams per important endpoint

**2d. Enhanced Configuration Intelligence (S13 → S12 in current)**
- Detect hardcoded values (magic numbers, inline strings that look like URLs/ports)
- Detect feature flags (LaunchDarkly, Unleash, custom patterns)
- Detect missing .env.example entries
- Flag unsafe defaults (DEBUG=true, LOG_LEVEL=debug in prod)

**2e. Enhanced Change Impact (S15 → S14 in current)**
- Add affected features list per file
- Add affected runtime paths per file  
- Add rollback strategy hints
- Compute transitive blast radius (not just direct dependents)

**2f. Enhanced Project Memory (S21 → S20 in current)**
- On regeneration: read existing Brain file's S20 section and merge history
- Preserve architecture decisions, known failures, and evolution timeline
- Add active work detection from recent git commits (if .git exists)

---

### Phase 3: New Output Sections

#### [MODIFY] [ai-pos-dropin.js](file:///h:/pgos/ai-pos-dropin.js)

**3a. S2 — Domain Intelligence Section** (NEW)
- Domain glossary table
- Entity relationship map  
- Business capability tree
- Lifecycle diagrams (Mermaid)

**3b. S4 — Repository Knowledge Graph Section** (REPLACE current S4)
- Knowledge graph table: Node → Type → Relationships
- Cross-module relationship edges
- Mermaid knowledge graph diagram

**3c. S6 — Function Intelligence Section** (NEW, replaces current S5)
- Per-function detail blocks for top 30 important functions
- Side effect annotations
- Call chain context

**3d. S12 — Data Intelligence Section** (NEW)
- Database model table
- Migration history
- Data flow map
- Repository → Entity mapping

**3e. S28 — Adoption & Usability Section** (NEW)
- Quick start guide for AI agents
- Quick start guide for human developers
- CI/CD integration snippets (GitHub Actions, GitLab CI)
- Monorepo usage guidance

---

### Phase 4: Visualization Upgrades

#### [MODIFY] [ai-pos-dropin.js](file:///h:/pgos/ai-pos-dropin.js)

- Add `generateKnowledgeGraphMermaid()` — Full relationship graph
- Add `generateEventFlowMermaid()` — Publisher → Subscriber diagram
- Add `generateStateFlowMermaid()` — State mutation flow
- Add `generateDataFlowMermaid()` — Entity → Repository → Service flow
- Enhance `generateCallGraphMermaid()` — Show function-level detail, not just files

---

### Phase 5: Section Renumbering & Brain Template Update

Align the 28 sections with the AIRB spec numbering:

| New § | Title | Old § |
|-------|-------|-------|
| 1 | Project Identity | S1 (enhanced) |
| 2 | Domain Intelligence | **NEW** |
| 3 | Architecture Intelligence | S3 (enhanced) |
| 4 | Repository Knowledge Graph | **NEW** (replaces old S4) |
| 5 | Feature Intelligence | S8 (rewritten) |
| 6 | Function Intelligence | **NEW** (replaces old S5) |
| 7 | Execution Intelligence | S6 (enhanced) |
| 8 | State Intelligence | S9 (enhanced) |
| 9 | Event Intelligence | S10 (enhanced) |
| 10 | Dependency Intelligence | S7 (enhanced) |
| 11 | API & Contract Intelligence | S11 (enhanced) |
| 12 | Data Intelligence | **NEW** |
| 13 | Configuration Intelligence | S12 (enhanced) |
| 14 | Test Intelligence | S13 (enhanced) |
| 15 | Change Impact Engine | S14 (enhanced) |
| 16 | Risk Intelligence | S15 (enhanced) |
| 17 | Performance Intelligence | S16 (enhanced) |
| 18 | Observability Intelligence | S17 (enhanced) |
| 19 | Security Intelligence | S18 (enhanced) |
| 20 | Technical Debt Intelligence | S19 (enhanced) |
| 21 | Project Memory | S20 (enhanced) |
| 22 | AI Operating System | S21 (enhanced) |
| 23 | AI Navigation Engine | S22 (enhanced) |
| 24 | Token Compression Engine | S23 (enhanced) |
| 25 | False Generation Prevention | S24 (enhanced) |
| 26 | Validation Engine | S25 (enhanced) |
| 27 | Visualization Engine | S26 (enhanced) |
| 28 | Adoption & Usability | **NEW** |

> [!IMPORTANT]
> The Quality Manifest (old S28) is merged into S26 (Validation Engine) since they serve similar purposes.

---

## Open Questions

> [!IMPORTANT]
> **Section depth vs. token budget**: The full AIRB spec demands exhaustive per-function intelligence for "every important function." For a 500-file repo this could generate a 100K+ token Brain file, defeating the token savings goal. Should we cap function intelligence to the top 50 most important functions and use L5/L6 compression for the rest?

> [!WARNING]
> **Git integration**: The Project Memory section could be much richer if we parse `.git/log` for recent commits, but the Docker container mounts the repo as a volume and `.git` may or may not be available. Should we attempt git history parsing with a graceful fallback?

> [!IMPORTANT]
> **README parsing**: We can infer business purpose, goals, and non-goals from README.md if it exists. Should we parse README.md and extract the first few paragraphs as the "Business Purpose" for S1?

---

## Verification Plan

### Automated Tests
1. **Existing E2E test** — Update `test-standalone.js` mock project with:
   - ORM model files (Prisma schema patterns)
   - Domain entity classes with relationships
   - Multiple route groups (auth, users, products) to test real feature inference
   - README.md for business purpose extraction
2. **Run via Docker**: `docker run --rm -v "H:\pgos:/app" -w /app node:20-alpine node packages/context-engine/src/__tests__/test-standalone.js`
3. **Assert** all 28 AIRB sections are present and populated with semantic content
4. **Assert** function intelligence shows called-by/calls/side-effects for at least the top functions
5. **Assert** domain intelligence generates entity relationships
6. **Assert** knowledge graph has cross-module edges

### Manual Verification
- Run the generator on the `pgos` repository itself and inspect the output for accuracy
- Compare generated Brain file size against token budget targets (5K-20K tokens)
