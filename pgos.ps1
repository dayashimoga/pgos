# ====================================================================
# Project Guardian OS (PGOS) — Zero-Install Universal Client CLI
# Drop this script into any project root to instantly run PGOS engines.
# ====================================================================

param (
    [string]$Command = "help",
    [string]$ExtraArgs = ""
)

# 1. Configuration
$pgosHome = "h:\pgos"  # Home directory of the cloned PGOS repository
$fallbackImage = "node:20-slim"
$containerName = "pgos-client-runner"
$projectRoot = Get-Item .

Write-Host "--------------------------------------------------------" -ForegroundColor Cyan
Write-Host " [PGOS] Project Guardian OS -- Project Proxy CLI" -ForegroundColor Cyan
Write-Host "--------------------------------------------------------" -ForegroundColor Cyan

# 2. Check if Docker is active
if (!(docker ps 2>$null)) {
    Write-Host "[ERROR] Docker Desktop is not running. Please start Docker and retry." -ForegroundColor Red
    exit 1
}

# 3. Determine run command
$dockerCmd = ""
switch ($Command) {
    'init' {
        Write-Host "[INIT] Initializing PGOS configurations in $projectRoot..." -ForegroundColor Yellow
        $dockerCmd = 'node apps/cli/dist/index.js init /project'
    }
    'validate' {
        Write-Host "[VALIDATE] Running complete PGOS validation suite..." -ForegroundColor Yellow
        $dockerCmd = 'node apps/cli/dist/index.js validate /project'
    }
    'context' {
        Write-Host "[CONTEXT] Compiling L0-L4 workspace context package..." -ForegroundColor Yellow
        $dockerCmd = 'node apps/cli/dist/index.js context compile /project'
    }
    'docs' {
        Write-Host "[DOCS] Compiling 20-folder master documentation set..." -ForegroundColor Yellow
        $dockerCmd = 'node apps/cli/dist/index.js docs generate --root-path /project'
    }
    'snapshot' {
        Write-Host "[SNAPSHOT] Creating point-in-time snapshot checkpoint..." -ForegroundColor Yellow
        $dockerCmd = 'node apps/cli/dist/index.js snapshot create --path /project ' + $ExtraArgs
    }
    'rollback' {
        Write-Host "[ROLLBACK] Restoring state to target stable snapshot..." -ForegroundColor Yellow
        $dockerCmd = 'node apps/cli/dist/index.js recovery rollback --root-path /project ' + $ExtraArgs
    }
    'report' {
        Write-Host "[REPORT] Generating HTML dashboard and savings report..." -ForegroundColor Yellow
        $dockerCmd = 'node apps/cli/dist/index.js report --root-path /project --output /project/.guardian/pgos-report.html'
    }
    'uninstall' {
        Write-Host "[UNINSTALL] Removing PGOS artifacts from project..." -ForegroundColor Yellow
        if (Test-Path "$projectRoot\.guardian") {
            Remove-Item -Recurse -Force "$projectRoot\.guardian"
            Write-Host "Removed .guardian/ directory." -ForegroundColor Green
        }
        if (Test-Path "$projectRoot\.guardian\pgos-report.html") {
            Remove-Item -Force "$projectRoot\.guardian\pgos-report.html"
            Write-Host "Removed .guardian\pgos-report.html." -ForegroundColor Green
        }
        Write-Host "PGOS has been successfully uninstalled from this project!" -ForegroundColor Green
        Write-Host "To complete removal, simply delete this pgos.ps1 file." -ForegroundColor Gray
        exit 0
    }
    default {
        Write-Host "Usage: .\pgos.ps1 command [args]" -ForegroundColor White
        Write-Host ""
        Write-Host "Available Commands:" -ForegroundColor Gray
        Write-Host "  init                 Initialize .guardian/ rules and config structures" -ForegroundColor Gray
        Write-Host "  validate             Run completeness, anti-pattern, and dependency validation" -ForegroundColor Gray
        Write-Host "  context              Compile optimized active context file for LLM models" -ForegroundColor Gray
        Write-Host "  docs                 Synthesize C4 diagrams and generate 20-folder master docs" -ForegroundColor Gray
        Write-Host "  snapshot             Capture code, context, and test metrics before prompt runs" -ForegroundColor Gray
        Write-Host "  rollback --id id     Revert whole codebase state to specified snapshot" -ForegroundColor Gray
        Write-Host "  report               Generate HTML health dashboard and ROI savings metrics" -ForegroundColor Gray
        Write-Host "  uninstall            Remove all PGOS traces, context, and reports from project" -ForegroundColor Gray
        exit 0
    }
}

# Add extra parameters if provided
if ($ExtraArgs -and $Command -ne "snapshot" -and $Command -ne "rollback") {
    $dockerCmd = $dockerCmd + ' ' + $ExtraArgs
}

# 4. Clean up any stale client containers
if (docker ps -a --format '{{.Names}}' | Select-String "^$containerName$") {
    docker rm -f $containerName | Out-Null
}

# 5. Launch isolated runner mounting both PGOS home and target project root
Write-Host "Mounting PGOS workspace and project target..." -ForegroundColor Yellow

$mountPGOS = "${pgosHome}:/app"
$mountProject = "${projectRoot}:/project"

$execCmd = $dockerCmd

docker run --rm `
    --name $containerName `
    -v $mountPGOS `
    -v $mountProject `
    -w /app `
    -e NODE_ENV=production `
    $fallbackImage `
    sh -c $execCmd

$exitCode = $LASTEXITCODE

if ($exitCode -eq 0) {
    Write-Host "[SUCCESS] Operation completed successfully!" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Operation failed with exit code $exitCode" -ForegroundColor Red
}

exit $exitCode
