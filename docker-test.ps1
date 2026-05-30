# ============================================================
# PGOS Docker Test Runner
# Builds and runs the full test suite inside Docker.
# No local Node.js, pnpm, or npm required.
#
# Usage:
#   .\docker-test.ps1               # Run all tests (context-engine + core)
#   .\docker-test.ps1 -Filter core  # Run only @pgos/core tests
#   .\docker-test.ps1 -Coverage     # Run with coverage report
#   .\docker-test.ps1 -Build        # TypeScript compile check only
#   .\docker-test.ps1 -Rebuild      # Force rebuild image before testing
#   .\docker-test.ps1 -Watch        # Run tests in watch mode
# ============================================================

param (
    [string]$Filter        = "",
    [switch]$Coverage      = $false,
    [switch]$Build         = $false,
    [switch]$Rebuild       = $false,
    [switch]$Watch         = $false,
    [switch]$AllPackages   = $false,
    [string]$ExtraArgs     = ""
)

$imageName     = "pgos-test-runner"
$workspaceDir  = (Resolve-Path ".").Path
$dockerfile    = "Dockerfile.test"
$containerName = "pgos-test-run"

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " PGOS Docker Test Runner" -ForegroundColor Cyan
Write-Host " Workspace: $workspaceDir" -ForegroundColor DarkGray
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# ── Check Docker is available ────────────────────────────────
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] Docker is not available in PATH." -ForegroundColor Red
    Write-Host "        Install Docker Desktop: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}

$dockerRunning = docker info 2>&1 | Select-String "Server Version" -Quiet
if (-not $dockerRunning) {
    Write-Host "[ERROR] Docker daemon is not running. Start Docker Desktop first." -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Docker is available" -ForegroundColor Green

# ── Clean up any existing container ─────────────────────────
$existing = docker ps -a --format "{{.Names}}" 2>$null | Where-Object { $_ -eq $containerName }
if ($existing) {
    Write-Host "[INFO] Removing existing container '$containerName'..." -ForegroundColor DarkGray
    docker rm -f $containerName | Out-Null
}

# ── Build image ──────────────────────────────────────────────
$buildArgs = @("build", "-f", $dockerfile, "-t", $imageName)
if ($Rebuild) {
    $buildArgs += "--no-cache"
    Write-Host "[INFO] Force-rebuilding image (--no-cache)..." -ForegroundColor Yellow
} else {
    Write-Host "[INFO] Building image '$imageName' (cached layers used if available)..." -ForegroundColor Yellow
}
$buildArgs += "--target"
$buildArgs += "test"
$buildArgs += "."

$buildStart = Get-Date
docker @buildArgs
$buildExit = $LASTEXITCODE
$buildDuration = [math]::Round(((Get-Date) - $buildStart).TotalSeconds, 1)

if ($buildExit -ne 0) {
    Write-Host ""
    Write-Host "[FAIL] Docker image build failed (exit $buildExit)" -ForegroundColor Red
    exit $buildExit
}

Write-Host "[OK] Image built in ${buildDuration}s" -ForegroundColor Green
Write-Host ""

# ── Compose the pnpm test command ───────────────────────────
if ($Build) {
    # TypeScript compile check only
    $testCmd = "pnpm --filter @pgos/core --filter @pgos/context-engine typecheck"
    Write-Host "[MODE] TypeScript compile check" -ForegroundColor Cyan
} elseif ($Coverage) {
    # Coverage run
    $testCmd = "pnpm --filter @pgos/core --filter @pgos/context-engine run test -- --coverage --reporter=verbose"
    Write-Host "[MODE] Test with coverage" -ForegroundColor Cyan
} elseif ($Watch) {
    # Watch mode
    $testCmd = "pnpm --filter @pgos/context-engine run test -- --watch"
    Write-Host "[MODE] Test watch mode" -ForegroundColor Cyan
} elseif ($Filter -ne "") {
    # Single package filter
    $testCmd = "pnpm --filter @pgos/$Filter run test -- --reporter=verbose"
    Write-Host "[MODE] Filtered test: @pgos/$Filter" -ForegroundColor Cyan
} elseif ($AllPackages) {
    # All packages
    $testCmd = "pnpm test --reporter=verbose"
    Write-Host "[MODE] All packages test" -ForegroundColor Cyan
} else {
    # Default: core + context-engine
    $testCmd = "pnpm --filter @pgos/core --filter @pgos/context-engine run test -- --reporter=verbose"
    Write-Host "[MODE] Default: @pgos/core + @pgos/context-engine" -ForegroundColor Cyan
}

if ($ExtraArgs) {
    $testCmd += " $ExtraArgs"
}

Write-Host "[CMD]  $testCmd" -ForegroundColor DarkGray
Write-Host ""

# ── Run tests ────────────────────────────────────────────────
$testStart = Get-Date

docker run --rm `
    --name $containerName `
    -e NODE_ENV=test `
    -e CI=true `
    -e FORCE_COLOR=1 `
    $imageName `
    sh -c $testCmd

$exitCode      = $LASTEXITCODE
$testDuration  = [math]::Round(((Get-Date) - $testStart).TotalSeconds, 1)

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan

if ($exitCode -eq 0) {
    Write-Host " [PASS] All tests passed in ${testDuration}s" -ForegroundColor Green
} else {
    Write-Host " [FAIL] Tests failed (exit $exitCode) after ${testDuration}s" -ForegroundColor Red
}

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

exit $exitCode
