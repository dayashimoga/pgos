# AI Repository Brain Generator — Drop-In Script Redesign

Complete rewrite of the drop-in scripts to produce a **SINGLE ultra-intelligent `AI_REPOSITORY_BRAIN.md`** file covering all 28 specification sections.

## User Review Required

> [!IMPORTANT]
> The current `ai-pos-dropin.js` (603 lines) produces 18 shallow markdown files + 11 JSON artifacts. The new version will produce **ONE consolidated master file** (`AI_REPOSITORY_BRAIN.md`) containing all 28 intelligence sections with deep semantic inference, function call graphs, Mermaid diagrams, blast radius scoring, and token-optimized compression. The separate satellite files (`AI_ARCHITECTURE.md`, `AI_FEATURES.md`, etc.) will be **removed** — everything lives in the Brain.

> [!WARNING]
> The existing PowerShell fallback (lines 53–243 of `ai-pos-dropin.ps1`) currently produces only 5 shallow artifacts. It will be upgraded to produce a meaningful (though reduced-fidelity) `AI_REPOSITORY_BRAIN.md` even without Node.js or Docker. However, the PowerShell fallback cannot match the depth of the JS engine (no AST-level analysis, no function call graphs). The same applies to the Bash fallback.

## Open Questions

> [!IMPORTANT]
> **Output location**: Currently artifacts go to `.guardian/ai-pos/`. Should the single `AI_REPOSITORY_BRAIN.md` continue to go there, or should it be placed at the repository root for maximum discoverability? The current plan keeps `.guardian/ai-pos/` as the output directory and updates `.cursorrules` / `.windsurfrules` / `.github/copilot-instructions.md` to point to it.

> [!IMPORTANT]
> **File size concern**: A full 28-section Brain for a large repo (500+ files) could be 15,000–30,000 lines of markdown. Should we implement a `--compact` mode that generates an abridged version (\~3,000 lines) for token-constrained LLMs? The plan includes this as an optional flag.

---

## Proposed Changes

### Gap Analysis — Current vs Required

| Section | Current State | New State |
|---------|--------------|-----------|
| §1 Project Identity | ✅ Basic (name, lang, framework) | Deep (domain, maturity, phase, objectives, non-goals) |
| §2 Semantic Summary | ❌ Missing | Full (what/how/critical systems/workflows) |
| §3 Architecture | ⚠️ Shallow (pattern name only) | Deep (layers, boundaries, Mermaid diagrams) |
| §4 Module Intelligence | ❌ Missing | Full (per-module purpose, risk, dependencies) |
| §5 Function Call Graph | ❌ Missing | Full (call chains, cross-module, async flows) |
| §6 Execution Flows | ⚠️ Shallow (startup only) | Full (startup, request, event, shutdown, recovery) |
| §7 Dependency Intelligence | ⚠️ Shallow (import list) | Full (module/service/runtime graphs, circulars, SPOFs) |
| §8 Feature Intelligence | ⚠️ Basic | Full (status, coverage, runtime impact, risk) |
| §9 State Flow | ❌ Missing | Full (owners, mutations, propagation) |
| §10 Event Flow | ❌ Missing | Full (publishers, subscribers, event graphs) |
| §11 API & Contracts | ⚠️ Basic (route list) | Full (schemas, validation, auth, errors, drift) |
| §12 Configuration | ⚠️ Basic (env vars) | Full (flags, profiles, secrets detection) |
| §13 Test Intelligence | ⚠️ Basic (count) | Full (feature→test map, gaps, regression risks) |
| §14 Change Impact | ❌ Missing | Full (blast radius, affected tests, rollback) |
| §15 Risk Intelligence | ⚠️ Basic (score) | Full (per-file scores, SPOF detection) |
| §16 Performance | ⚠️ Placeholder | Full (hot paths, bottlenecks, async patterns) |
| §17 Observability | ⚠️ Placeholder | Full (logging, metrics, tracing, blind spots) |
| §18 Security | ⚠️ Basic | Full (auth flow, trust boundaries, vulnerability scan) |
| §19 Technical Debt | ⚠️ Basic (TODO count) | Full (priority, impact, fix complexity) |
| §20 Project Memory | ❌ Placeholder | Full (decisions, failures, evolution history) |
| §21 AI Operating Rules | ✅ Good | Enhanced (repo-specific, context-aware rules) |
| §22 Navigation Engine | ⚠️ Basic | Full (tiered context loading) |
| §23 Token Optimization | ❌ Missing | Full (L0–L6 hierarchical compression) |
| §24 False Generation Prevention | ❌ Missing | Full (stub detection, confidence scoring) |
| §25 Validation Engine | ⚠️ Basic | Full (import validation, stale detection) |
| §26 Visualization | ❌ Missing | Full (Mermaid diagrams for all flows) |
| §27 Advanced Analyzers | ❌ Missing | Integrated into sections above |
| §28 Quality Requirements | N/A | Self-validation pass |

---

### Component 1: Core JS Engine Rewrite

#### [MODIFY] [ai-pos-dropin.js](file:///h:/pgos/ai-pos-dropin.js)

Complete rewrite. The file grows from ~603 lines to ~2,500+ lines, structured as a single zero-dependency ESM module with the following internal architecture:

**Phase 1 — Deep File Scanner** (replaces current `analyzeFileHeuristics`)
- Multi-language regex AST parser supporting: TS/JS, Python, Go, Rust, Java, C#
- Extract: functions (with params, return types, line numbers), classes (with methods, extends), interfaces, enums, type aliases
- Extract: all import/export relationships with source resolution
- Extract: inline `TODO`/`FIXME`/`HACK`/`DEPRECATED` with line numbers and surrounding context
- Extract: string literals for env var detection (`process.env.X`, `os.environ['X']`)
- Detect: `async` functions, generator functions, middleware chains
- Detect: event emitters/listeners (`on`, `emit`, `addEventListener`, `subscribe`)
- Detect: state mutations (`setState`, `this.state`, `store.dispatch`, `ref`, `reactive`)
- Detect: route definitions (`app.get`, `router.post`, `@Get`, `@Post`, `@app.route`)
- Detect: decorator patterns (`@Injectable`, `@Controller`, `@Service`)

**Phase 2 — Cross-File Intelligence Builders** (12 new analyzer functions)
1. `buildFunctionCallGraph()` — Resolve function→function calls across files using export/import chains
2. `buildDependencyGraph()` — Module-level import graph with circular detection (Tarjan's algorithm)
3. `detectArchitecture()` — Pattern matching for monolith/layered/DDD/hexagonal/CQRS/event-driven/microservices
4. `buildExecutionFlows()` — Infer startup→request→event→shutdown→recovery chains
5. `buildFeatureMatrix()` — Group files by feature ownership, map to tests
6. `buildStateFlowMap()` — Track state owners, mutators, propagation paths
7. `buildEventFlowMap()` — Map event publishers→subscribers→handlers
8. `extractAPIContracts()` — Routes, schemas, validation, auth middleware chains
9. `analyzeBlastRadius()` — Per-file: what depends on it, what breaks if modified
10. `analyzeRisks()` — Composite risk scoring (coupling × complexity × test coverage × criticality)
11. `analyzePerformance()` — Hot path detection, async pattern analysis, IO bottleneck heuristics
12. `analyzeSecurity()` — Auth flow tracing, secret detection, trust boundary mapping

**Phase 3 — Single Brain Generator** (replaces 18 separate generators)
- One function: `generateBrainMd(intel)` that produces the entire `AI_REPOSITORY_BRAIN.md`
- All 28 sections rendered inline with Mermaid diagrams
- Token-optimized: semantic summaries, not raw metadata
- Self-validation pass at the end (broken refs, empty sections, confidence scoring)

**Phase 4 — Output Writer**
- Write `AI_REPOSITORY_BRAIN.md` to `.guardian/ai-pos/`
- Write `.cursorrules`, `.windsurfrules`, `.github/copilot-instructions.md` — pointing to Brain file
- **Remove** all separate satellite files (`AI_ARCHITECTURE.md`, `AI_FEATURES.md`, etc.)
- Optionally write `AI_BRAIN_COMPACT.md` if `--compact` flag is set

---

### Component 2: PowerShell Fallback Upgrade

#### [MODIFY] [ai-pos-dropin.ps1](file:///h:/pgos/ai-pos-dropin.ps1)

The PowerShell fallback (lines 53–243) is rewritten to produce a meaningful Brain file:

- **Enhanced file scanning**: Extract function names, class names, imports using `Select-String` with regex
- **Function call graph**: Basic cross-file call detection using `Select-String` matching exported function names
- **Architecture detection**: Infer from directory structure (`src/domain/`, `src/infrastructure/`, `routes/`, `controllers/`)
- **Safety zones**: Enhanced classification with per-file blast radius estimation
- **Full Brain template**: All 28 sections rendered (some with reduced fidelity: "Requires JS engine for full analysis")
- **Docker path fix**: Update Dockerfile.ai-pos to use volume-only approach (no COPY needed)

---

### Component 3: Bash Fallback Upgrade

#### [MODIFY] [ai-pos-dropin.sh](file:///h:/pgos/ai-pos-dropin.sh)

Mirror the PowerShell fallback improvements:

- Enhanced scanning with `grep -rn` for functions, classes, imports
- Same Brain template structure
- Docker path with volume mapping fix

---

### Component 4: Docker Integration Fix

#### [MODIFY] [.dockerignore](file:///h:/pgos/.dockerignore)

- Keep `ai-pos-dropin.js` out of the exclusion list (already fixed)

#### [MODIFY] Dockerfile.ai-pos generation (inline in PS1/SH)

- Switch from `COPY` approach to `volume-only` approach:
  ```dockerfile
  FROM node:20-alpine
  WORKDIR /app
  CMD ["node", "/app/ai-pos-dropin.js"]
  ```
  This eliminates the need to COPY the JS file into the image — it's already available via the volume mount.

---

## Verification Plan

### Automated Tests
1. Run `.\ai-pos-dropin.ps1` inside `h:\pgos` (the PGOS monorepo itself) and verify:
   - `AI_REPOSITORY_BRAIN.md` is generated
   - All 28 sections are present (grep for `## §` headings)
   - Mermaid diagrams are present (grep for ` ```mermaid`)
   - Function call graphs are present
   - Confidence score is > 50%
   - File size is > 5KB

2. Run `.\ai-pos-dropin.ps1` inside `h:\autonomousAI` (the autonomous AI project) and verify:
   - Same structural checks
   - Different content (project-specific intelligence)

3. Verify Docker path works:
   - Remove Node from PATH temporarily
   - Run `.\ai-pos-dropin.ps1` → should use Docker
   - Verify identical output

### Manual Verification
- Open generated `AI_REPOSITORY_BRAIN.md` in VS Code and verify:
  - Mermaid diagrams render correctly
  - Function call trees are accurate
  - Safety classifications match reality
  - No empty/placeholder sections
  - Token count is reasonable (\~5,000–15,000 tokens for medium repos)
