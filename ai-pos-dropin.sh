#!/bin/bash
# ═══════════════════════════════════════════════════════════════════
# AI-POS Brain Generator v3.0.0 — Bash Bootstrapper
# Runs: Node.js (local) → Docker (containerized) → Bash (native fallback)
# ═══════════════════════════════════════════════════════════════════

rootPath=$(pwd)
projectName=$(basename "$rootPath")
generatedAt=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

echo ""
echo "======================================"
echo " AI-POS Brain Generator v3.0.0"
echo " Repository: $rootPath"
echo "======================================"

# ─── 1. TRY LOCAL NODE.JS ─────────────────────────────────────
if command -v node >/dev/null 2>&1; then
    echo "[INFO] Node.js detected. Attempting full JS engine..."
    if [ -f "ai-pos-dropin.js" ]; then
        node ai-pos-dropin.js
        if [ $? -eq 0 ]; then exit 0; fi
        echo "[WARN] Node.js execution failed."
    else
        echo "[WARN] ai-pos-dropin.js not found locally."
    fi
else
    echo "[INFO] Node.js not found locally."
fi

# ─── 2. TRY DOCKER ────────────────────────────────────────────
if command -v docker >/dev/null 2>&1; then
    echo "[INFO] Docker detected. Checking daemon status..."
    if docker info >/dev/null 2>&1; then
        if [ -f "ai-pos-dropin.js" ]; then
            echo "  Building lightweight container to run engine..."
            docker run --rm -v "$rootPath:/app" -w /app node:20-alpine sh -c "node --experimental-detect-module /app/ai-pos-dropin.js"
            if [ $? -eq 0 ]; then exit 0; fi
            echo "[WARN] Docker run failed. Falling back to Bash..."
        else
            echo "[WARN] ai-pos-dropin.js not found locally."
        fi
    else
        echo "[WARN] Docker daemon is not running."
    fi
else
    echo "[INFO] Docker not found locally."
fi

# ─── 3. NATIVE BASH FALLBACK ──────────────────────────────────
echo "[WARN] Could not use Node.js or Docker. Running native Bash brain generator (reduced fidelity)..."

exclude_pattern='node_modules\|\.git\|dist\|build\|out\|coverage\|\.turbo\|\.next\|\.guardian\|\.idea\|\.vscode\|__pycache__'

# Find source files
source_files=$(find "$rootPath" -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.py" -o -name "*.go" -o -name "*.rs" -o -name "*.java" -o -name "*.cs" \) | grep -v "$exclude_pattern")

file_count=$(echo "$source_files" | grep -c .)
echo "  Scanning $file_count source files..."

total_loc=0
safe_count=0
caution_count=0
critical_count=0
func_count=0
class_count=0
route_count=0
todo_count=0

critical_files=""
caution_files_list=""
safe_files_list=""
functions_list=""
todos_list=""
imports_list=""
env_vars_list=""

critical_keywords="auth\|login\|db\|database\|schema\|migration\|security\|session\|middleware\|encrypt\|server\|main\|bootstrap\|config\|password"

while IFS= read -r f; do
    [ -z "$f" ] && continue
    [ ! -f "$f" ] && continue

    lines=$(wc -l < "$f" 2>/dev/null || echo 0)
    total_loc=$((total_loc + lines))

    relpath="${f#$rootPath/}"
    filename=$(basename "$f")

    # Function detection
    fc=$(grep -cE '(function\s+\w+|const\s+\w+\s*=\s*(async\s*)?\([^)]*\)\s*=>|def\s+\w+|func\s+\w+)' "$f" 2>/dev/null || echo 0)
    func_count=$((func_count + fc))

    # Class detection
    cc=$(grep -cE 'class\s+\w+' "$f" 2>/dev/null || echo 0)
    class_count=$((class_count + cc))

    # Route detection
    rc=$(grep -cEi '(app|router|server)\.(get|post|put|patch|delete)\s*\(' "$f" 2>/dev/null || echo 0)
    route_count=$((route_count + rc))

    # TODO detection
    tc=$(grep -cEi '\b(TODO|FIXME|HACK)\b' "$f" 2>/dev/null || echo 0)
    todo_count=$((todo_count + tc))
    if [ "$tc" -gt 0 ]; then
        todo_items=$(grep -nEi '\b(TODO|FIXME|HACK)\b' "$f" 2>/dev/null | head -3 | sed "s|^|- [\`$relpath\`] |")
        todos_list="$todos_list
$todo_items"
    fi

    # Top functions
    funcs=$(grep -oE '(function\s+(\w+)|const\s+(\w+)\s*=\s*(async\s*)?\()' "$f" 2>/dev/null | grep -oE '\w+' | head -5)
    functions_list="$functions_list $funcs"

    # Safety classification
    if echo "$filename" | grep -qiE 'test|spec'; then
        safe_count=$((safe_count + 1))
        safe_files_list="$safe_files_list
- \`$relpath\`"
    elif echo "$relpath" | grep -qi "$critical_keywords"; then
        critical_count=$((critical_count + 1))
        critical_files="$critical_files
- \`$relpath\` [CRITICAL]"
    else
        caution_count=$((caution_count + 1))
    fi
done <<< "$source_files"

risk_score=$((critical_count * 100 / (file_count > 0 ? file_count : 1) + 15))
[ "$risk_score" -gt 100 ] && risk_score=100
confidence=$((85 - todo_count * 2))
[ "$confidence" -lt 10 ] && confidence=10
[ "$confidence" -gt 100 ] && confidence=100

echo "[OK] Analysis complete: $func_count functions, $class_count classes, $route_count routes"

# ─── GENERATE BRAIN ───────────────────────────────────────────
mkdir -p "$rootPath/.github"
mkdir -p "$rootPath/.guardian/ai-pos"

cat > "$rootPath/.guardian/ai-pos/AI_REPOSITORY_BRAIN.md" << BRAINEOF
# AI REPOSITORY BRAIN — $projectName

> **FOR AI AGENTS**: Read this FIRST — replaces 90-95% of repository scanning.
> **Confidence**: ${confidence}% | **Generated**: $generatedAt | **Engine**: PGOS AI-POS v3.0.0 (Bash)
> **Files**: $file_count | **LOC**: $total_loc

---

## 1 — PROJECT IDENTITY
| Attribute | Value |
|-----------|-------|
| **Name** | $projectName |
| **Scale** | $file_count files, $total_loc LOC |
| **Functions** | $func_count |
| **Classes** | $class_count |
| **Endpoints** | $route_count |

---

## 2 — SEMANTIC SUMMARY
$projectName is an application with $file_count source files and $total_loc lines of code containing $func_count functions and $class_count classes.

---

## 4 — CRITICAL FILES
$critical_files

---

## 14 — CHANGE IMPACT
Modifying any critical file listed above requires blast radius analysis.

---

## 15 — RISK INTELLIGENCE
**Overall Risk Score: $risk_score/100**
- Critical: $critical_count | Caution: $caution_count | Safe: $safe_count
- Tech Debt: $todo_count items

---

## 19 — TECHNICAL DEBT ($todo_count items)
$todos_list

---

## 21 — AI OPERATING RULES

### ALWAYS
- Read this Brain file before scanning source code
- Preserve all comments and documentation
- Match code style and naming conventions
- Check blast radius before editing critical files

### NEVER
- Delete test files without replacements
- Hardcode credentials or secrets
- Leave empty stubs or TODO placeholders

### BEFORE EDITING
- Check file safety zone (Safe/Caution/Critical)
- Review blast radius for impact

### AFTER EDITING
- Validate build. Run tests. Update brain if interfaces changed.

---
*Generated by PGOS AI-POS v3.0.0 (Bash Native) | $generatedAt*
*For full 28-section intelligence with Mermaid diagrams, install Node.js or Docker.*
BRAINEOF

# Rules file
rules_content="# AI Context & Operating Rules — $projectName
> Read \`.guardian/ai-pos/AI_REPOSITORY_BRAIN.md\` FIRST.
## $projectName | $file_count files | $total_loc LOC | Risk: $risk_score/100
## Brain: \`.guardian/ai-pos/AI_REPOSITORY_BRAIN.md\`
## Safety: Safe($safe_count) Caution($caution_count) Critical($critical_count)
## ALWAYS: Preserve comments. Match style. Check blast radius.
## NEVER: Delete tests. Hardcode secrets. Leave stubs.
---
*Generated by PGOS AI-POS v3.0.0 (Bash)*"

echo "$rules_content" > "$rootPath/.cursorrules"
echo "$rules_content" > "$rootPath/.windsurfrules"
echo "$rules_content" > "$rootPath/.github/copilot-instructions.md"

echo ""
echo "================================================"
echo " AI-POS Brain Generation Complete!"
echo "================================================"
echo "   Brain:      .guardian/ai-pos/AI_REPOSITORY_BRAIN.md"
echo "   Rules:      .cursorrules, .windsurfrules, .github/copilot-instructions.md"
echo "   Confidence: ${confidence}%"
echo "   Risk Score: $risk_score/100"
echo ""
echo "   AI agents should read AI_REPOSITORY_BRAIN.md FIRST!"
echo ""
