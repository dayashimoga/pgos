# ═══════════════════════════════════════════════════════════════════
# AI-POS Brain Generator v3.0.0 — PowerShell Bootstrapper
# Runs: Node.js (local) → Docker (containerized) → PowerShell (native fallback)
# ═══════════════════════════════════════════════════════════════════

$rootPath = Get-Location
$projectName = $rootPath.Path.Split('\')[-1]
$generatedAt = (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host " AI-POS Brain Generator v3.0.0" -ForegroundColor Cyan
Write-Host " Repository: $rootPath" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

# ─── 1. TRY LOCAL NODE.JS ─────────────────────────────────────
$nodeAvailable = Get-Command node -ErrorAction SilentlyContinue

if ($nodeAvailable) {
    Write-Host "[INFO] Node.js detected. Attempting full JS engine..." -ForegroundColor Green
    if (Test-Path "ai-pos-dropin.js") {
        node ai-pos-dropin.js
        if ($LASTEXITCODE -eq 0) { exit }
        Write-Host "[WARN] Node.js execution failed (Exit Code: $LASTEXITCODE)." -ForegroundColor Yellow
    } else {
        Write-Host "[WARN] ai-pos-dropin.js not found locally." -ForegroundColor Yellow
    }
} else {
    Write-Host "[INFO] Node.js not found locally." -ForegroundColor DarkGray
}

# ─── 2. TRY DOCKER (No local Node needed) ─────────────────────
$dockerAvailable = Get-Command docker -ErrorAction SilentlyContinue

if ($dockerAvailable) {
    Write-Host "[INFO] Docker detected. Checking daemon status..." -ForegroundColor Green
    $dockerInfo = docker info 2>&1
    if ($LASTEXITCODE -eq 0) {
        if (Test-Path "ai-pos-dropin.js") {
            Write-Host "  Building lightweight container to run engine..." -ForegroundColor DarkCyan
            # Volume-only approach: JS file is available via mount, no COPY needed
            docker run --rm -v "${rootPath}:/app" -w /app node:20-alpine sh -c "node --experimental-detect-module /app/ai-pos-dropin.js"
            if ($LASTEXITCODE -eq 0) { exit }
            Write-Host "[WARN] Docker run failed (Exit Code: $LASTEXITCODE). Falling back to PowerShell..." -ForegroundColor Yellow
        } else {
            Write-Host "[WARN] ai-pos-dropin.js not found locally." -ForegroundColor Yellow
        }
    } else {
        Write-Host "[WARN] Docker daemon is not running." -ForegroundColor Yellow
    }
} else {
    Write-Host "[INFO] Docker not found locally." -ForegroundColor DarkGray
}

# ─── 3. NATIVE POWERSHELL FALLBACK ────────────────────────────
Write-Host "[WARN] Could not use Node.js or Docker. Running native PowerShell brain generator (reduced fidelity)..." -ForegroundColor Yellow

$exclude = @("node_modules", ".git", "dist", "build", "out", "coverage", ".turbo", ".next", ".guardian", ".idea", ".vscode", "__pycache__")
$codeExts = @(".ts", ".tsx", ".js", ".jsx", ".py", ".go", ".rs", ".java", ".cs", ".rb", ".php", ".cpp", ".c")

$files = Get-ChildItem -Path $rootPath -Recurse -File -ErrorAction SilentlyContinue | Where-Object {
    $path = $_.FullName
    $skip = $false
    foreach ($dir in $exclude) { if ($path -like "*\$dir\*") { $skip = $true; break } }
    $skip -eq $false
}

$sourceFiles = $files | Where-Object { $codeExts -contains $_.Extension.ToLower() }
$allFiles = @($sourceFiles)

Write-Host "  Scanning $($allFiles.Count) source files..." -ForegroundColor DarkCyan

$totalLoc = 0; $safeCount = 0; $cautionCount = 0; $criticalCount = 0
$functions = @(); $classes = @(); $imports = @(); $routes = @()
$todos = @(); $envVars = @(); $criticalFiles = @(); $cautionFiles = @(); $safeFiles = @()

$criticalKeywords = @("auth", "login", "db", "database", "schema", "migration", "security", "session", "middleware", "encrypt", "server", "main", "bootstrap", "config", "password")
$frameworkDetected = "Plain Application"

foreach ($file in $allFiles) {
    try {
        $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
        if (-not $content) { continue }
        $lines = $content -split "`n"
        $totalLoc += $lines.Count
        $relPath = $file.FullName.Replace($rootPath.Path, "").TrimStart("\").Replace("\", "/")

        # Function detection
        $funcMatches = [regex]::Matches($content, '(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(')
        foreach ($m in $funcMatches) { $functions += $m.Groups[1].Value }
        $arrowMatches = [regex]::Matches($content, '(?:export\s+)?(?:const|let)\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>')
        foreach ($m in $arrowMatches) { $functions += $m.Groups[1].Value }

        # Class detection
        $classMatches = [regex]::Matches($content, 'class\s+(\w+)')
        foreach ($m in $classMatches) { $classes += $m.Groups[1].Value }

        # Import detection
        $importMatches = [regex]::Matches($content, "(?:import|from|require)\s+['\x22]([^'\x22]+)['\x22]")
        foreach ($m in $importMatches) { $imports += $m.Groups[1].Value }

        # Route detection
        $routeMatches = [regex]::Matches($content, "(?:app|router|server)\.(get|post|put|patch|delete)\s*\(\s*['\x22]([^'\x22]+)['\x22]")
        foreach ($m in $routeMatches) { $routes += @{ Method = $m.Groups[1].Value.ToUpper(); Path = $m.Groups[2].Value; File = $relPath } }

        # TODO detection
        $todoMatches = [regex]::Matches($content, '\b(TODO|FIXME|HACK)\b[:\s]*(.*)')
        foreach ($m in $todoMatches) { $todos += @{ Type = $m.Groups[1].Value; Text = $m.Groups[2].Value.Substring(0, [Math]::Min(80, $m.Groups[2].Value.Length)); File = $relPath } }

        # Env var detection
        $envMatches = [regex]::Matches($content, 'process\.env\.(\w+)')
        foreach ($m in $envMatches) { $envVars += @{ Name = $m.Groups[1].Value; File = $relPath } }

        # Framework detection
        if ($content -match "from\s+['\x22]next") { $frameworkDetected = "Next.js" }
        elseif ($content -match "from\s+['\x22]react") { $frameworkDetected = "React" }
        elseif ($content -match "from\s+['\x22]fastify") { $frameworkDetected = "Fastify" }
        elseif ($content -match "from\s+['\x22]express") { $frameworkDetected = "Express" }

        # Safety classification
        if ($file.Name -like "*test*" -or $file.Name -like "*spec*" -or $file.Extension -in @(".md", ".txt", ".json")) {
            $safeCount++; $safeFiles += $relPath
        } else {
            $isCritical = $false
            foreach ($kw in $criticalKeywords) { if ($relPath.ToLower() -like "*$kw*") { $isCritical = $true; break } }
            if ($isCritical) { $criticalCount++; $criticalFiles += $relPath }
            else { $cautionCount++; $cautionFiles += $relPath }
        }
    } catch {}
}

# Detect architecture from directory structure
$archPattern = "Layered"
$archEvidence = @()
$allPaths = $allFiles | ForEach-Object { $_.FullName.Replace($rootPath.Path, "").ToLower() }
if ($allPaths -match "domain" -and $allPaths -match "infrastructure") { $archPattern = "DDD"; $archEvidence += "Domain + Infrastructure directories" }
elseif ($allPaths -match "packages" -or $allPaths -match "apps") { $archPattern = "Monorepo"; $archEvidence += "Multi-package workspace" }
if ($allPaths -match "routes" -or $allPaths -match "controllers") { $archEvidence += "Route/Controller layer detected" }
if ($allPaths -match "services") { $archEvidence += "Service layer detected" }

$riskScore = [Math]::Min(100, [Math]::Round(($criticalCount / [Math]::Max(1, $allFiles.Count)) * 100) + 15)
$confidence = [Math]::Max(10, [Math]::Min(100, 85 - ($todos.Count * 2)))

Write-Host "[OK] Analysis complete: $($functions.Count) functions, $($classes.Count) classes, $($routes.Count) routes" -ForegroundColor Green

# ─── GENERATE AI_REPOSITORY_BRAIN.md ──────────────────────────
$brainContent = @"
# AI REPOSITORY BRAIN - $projectName

> **FOR AI AGENTS**: This is the SINGLE master intelligence file. Read this FIRST.
> **Confidence**: ${confidence}% | **Generated**: $generatedAt | **Engine**: PGOS AI-POS v3.0.0 (PowerShell)
> **Files Analyzed**: $($allFiles.Count) | **LOC**: $totalLoc

---

## TABLE OF CONTENTS
| Section | Intelligence |
|---------|-------------|
| 1 | Project Identity |
| 2 | Semantic Summary |
| 3 | Architecture |
| 4-5 | Module & Function Intelligence |
| 6 | Execution Flows |
| 7 | Dependencies |
| 8 | Features |
| 11 | API Endpoints |
| 12 | Configuration |
| 13 | Tests |
| 14 | Change Impact |
| 15 | Risk |
| 18 | Security |
| 19 | Technical Debt |
| 21 | AI Operating Rules |
| 22 | Navigation |

---

## 1 - PROJECT IDENTITY

| Attribute | Value |
|-----------|-------|
| **Name** | $projectName |
| **Framework** | $frameworkDetected |
| **Architecture** | $archPattern |
| **Scale** | $($allFiles.Count) files, $totalLoc LOC |
| **Functions** | $($functions.Count) |
| **Classes** | $($classes.Count) |
| **Endpoints** | $($routes.Count) |

---

## 2 - SEMANTIC SUMMARY

$projectName is a $frameworkDetected application using $archPattern architecture with $($allFiles.Count) source files and $totalLoc lines of code.
$(if ($archEvidence.Count -gt 0) { "Evidence: " + ($archEvidence -join ", ") })

---

## 3 - ARCHITECTURE

**Pattern**: $archPattern
$(if ($archEvidence.Count -gt 0) { ($archEvidence | ForEach-Object { "- $_" }) -join "`n" })

---

## 4 - CRITICAL FILES

$(($criticalFiles | Select-Object -First 15 | ForEach-Object { "- ``$_`` [CRITICAL]" }) -join "`n")

---

## 5 - FUNCTIONS ($($functions.Count) detected)

$(($functions | Select-Object -First 30 -Unique | ForEach-Object { "- ``$_()``" }) -join "`n")

---

## 6 - EXECUTION FLOWS

### Startup: Entry point files initialize config, services, and server listener.
### Request: Middleware chain, auth, validation, handler, response.
### Shutdown: Graceful connection drain and cleanup.

---

## 7 - DEPENDENCIES

External packages detected from imports:
$(($imports | Where-Object { -not $_.StartsWith(".") } | Select-Object -Unique -First 20 | ForEach-Object { "- ``$_``" }) -join "`n")

---

## 8 - FEATURES

$(($functions | Select-Object -Unique | Where-Object { $_ -match "handle|process|create|update|delete|get|set|init|register" } | Select-Object -First 15 | ForEach-Object { "- **$_**: Implemented" }) -join "`n")

---

## 11 - API ENDPOINTS ($($routes.Count))

$(if ($routes.Count -gt 0) { ($routes | Select-Object -First 20 | ForEach-Object { "| ``$($_.Method)`` | ``$($_.Path)`` | ``$($_.File)`` |" }) -join "`n" } else { "No HTTP routes detected." })

---

## 12 - CONFIGURATION

### Environment Variables ($($envVars.Count)):
$(($envVars | Select-Object -First 15 -Property Name -Unique | ForEach-Object { "- ``$($_.Name)``" }) -join "`n")

---

## 13 - TEST INTELLIGENCE

- **Test Files**: $safeCount (files classified as safe/test)
- **Source Files Without Tests**: $($cautionCount + $criticalCount)

---

## 14 - CHANGE IMPACT

### High-Impact Files (most imported):
$(($criticalFiles | Select-Object -First 10 | ForEach-Object { "- ``$_`` - Modifying requires blast radius analysis" }) -join "`n")

---

## 15 - RISK INTELLIGENCE

**Overall Risk Score: $riskScore/100**
- Critical Files: $criticalCount
- Technical Debt Items: $($todos.Count)

---

## 18 - SECURITY

$(if ($imports -match "jsonwebtoken|jwt|passport|bcrypt") { "- Auth: JWT/Password hashing detected" } else { "- Auth: None detected" })
$(($envVars | Where-Object { $_.Name -match "SECRET|PASSWORD|KEY|TOKEN" } | Select-Object -First 5 | ForEach-Object { "- Sensitive: ``$($_.Name)`` in ``$($_.File)``" }) -join "`n")

---

## 19 - TECHNICAL DEBT ($($todos.Count) items)

$(($todos | Select-Object -First 15 | ForEach-Object { "- [$($_.Type)] ``$($_.File)``: $($_.Text)" }) -join "`n")

---

## 21 - AI OPERATING RULES

### ALWAYS
- Read this Brain file FIRST before scanning source code
- Preserve all existing comments and documentation
- Match the project's code style and naming conventions
- Check blast radius (section 14) before editing critical files

### NEVER
- Never delete test files without replacements
- Never hardcode credentials or secrets
- Never leave empty stubs or TODO placeholders
- Never modify critical files without impact analysis

### BEFORE EDITING
- Check the file's safety zone (Safe/Caution/Critical)
- Review blast radius for cascading impacts
- Identify affected test files

### AFTER EDITING
- Validate compilation with zero errors
- Run affected test suites
- Regenerate brain if interfaces changed

---

## 22 - NAVIGATION

**Tier 0 (Critical)**: $(($criticalFiles | Select-Object -First 3) -join ", ")
**Tier 1 (Business)**: Service and handler files
**Tier 2 (Support)**: Utility and helper files
**Tier 3 (Tests)**: Test and spec files

---

*Generated by PGOS AI-POS Brain Generator v3.0.0 (PowerShell Native) | $generatedAt*
*For full 28-section intelligence with Mermaid diagrams, install Node.js or Docker.*
"@

# ─── RULES FILE ───────────────────────────────────────────────
$rulesContent = @"
# AI Context & Operating Rules - $projectName
> **FOR AI AGENTS**: Read ``.guardian/ai-pos/AI_REPOSITORY_BRAIN.md`` FIRST.

## Project: $projectName | $frameworkDetected | $archPattern | $($allFiles.Count) files | $totalLoc LOC
## Risk: $riskScore/100 | Confidence: ${confidence}%
## Brain: ``.guardian/ai-pos/AI_REPOSITORY_BRAIN.md``

## Safety Zones
- Safe ($safeCount): Tests, specs, docs
- Caution ($cautionCount): Business logic
- Critical ($criticalCount): Auth, DB, config, entry points

## ALWAYS: Preserve comments. Match code style. Check blast radius for critical files.
## NEVER: Delete tests. Hardcode secrets. Leave stubs. Break interfaces.
## BEFORE: Check safety zone. Review blast radius. Identify affected tests.
## AFTER: Validate build. Run tests. Update brain if interfaces changed.

---
*Generated by PGOS AI-POS v3.0.0 (PowerShell) | Read AI_REPOSITORY_BRAIN.md first*
"@

# ─── WRITE OUTPUT ─────────────────────────────────────────────
New-Item -ItemType Directory -Force -Path (Join-Path $rootPath ".github") | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $rootPath ".guardian\ai-pos") | Out-Null

Set-Content -Path (Join-Path $rootPath ".guardian\ai-pos\AI_REPOSITORY_BRAIN.md") -Value $brainContent
Set-Content -Path (Join-Path $rootPath ".cursorrules") -Value $rulesContent
Set-Content -Path (Join-Path $rootPath ".windsurfrules") -Value $rulesContent
Set-Content -Path (Join-Path $rootPath ".github\copilot-instructions.md") -Value $rulesContent

Write-Host ""
Write-Host "================================================" -ForegroundColor Green
Write-Host " AI-POS Brain Generation Complete!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host "   Brain:      .guardian/ai-pos/AI_REPOSITORY_BRAIN.md" -ForegroundColor White
Write-Host "   Rules:      .cursorrules, .windsurfrules, .github/copilot-instructions.md" -ForegroundColor White
Write-Host "   Confidence: ${confidence}%" -ForegroundColor White
Write-Host "   Risk Score: $riskScore/100" -ForegroundColor White
Write-Host ""
Write-Host "   AI agents should read AI_REPOSITORY_BRAIN.md FIRST!" -ForegroundColor Cyan
Write-Host ""
