# ====================================================================
# Project Guardian OS (PGOS) — Docker-based Development Runner
# Run any Node/pnpm command in an isolated Docker container without local installation.
# ====================================================================

param (
    [string]$Command = "build",
    [string]$ExtraArgs = ""
)

$imageName = "node:20-slim"
$containerName = "pgos-runner-container"
$workspaceDir = "h:\pgos"

# Helper function to clean up runner containers
function Cleanup-Container {
    if (docker ps -a --format '{{.Names}}' | Select-String "^$containerName$") {
        Write-Host "Cleaning up existing runner container..." -ForegroundColor Cyan
        docker rm -f $containerName | Out-Null
    }
}

# Check command types
if ($Command -eq "clean-images") {
    Write-Host "Cleaning up PGOS Docker images and dangling builders..." -ForegroundColor Magenta
    Cleanup-Container
    
    # Remove transient runner image if desired
    Write-Host "Removing builder cache images..." -ForegroundColor Yellow
    docker image prune -f
    
    # Optionally remove node:20-slim if requested
    $nodeImage = docker images -q $imageName
    if ($nodeImage) {
        Write-Host "Removing $imageName to save space..." -ForegroundColor Yellow
        docker rmi -f $imageName
    }
    
    Write-Host "Cleanup completed successfully!" -ForegroundColor Green
    exit 0
}

Cleanup-Container

Write-Host "--------------------------------------------------------" -ForegroundColor Cyan
Write-Host " PGOS Docker Runner: Running 'pnpm $Command' in $imageName" -ForegroundColor Cyan
Write-Host "--------------------------------------------------------" -ForegroundColor Cyan

# We build a command string that is executed inside the node container:
# 1. Installs pnpm globally
# 2. Runs the requested command
$dockerCmd = "npm install -g pnpm@9.1.0 --silent && "
if ($Command -eq "install") {
    $dockerCmd += "pnpm install"
} else {
    $dockerCmd += "pnpm run $Command"
}

if ($ExtraArgs) {
    $dockerCmd += " $ExtraArgs"
}

# Run the command mounting the current workspace
Write-Host "Launching container and executing..." -ForegroundColor Yellow
docker run --rm `
    --name $containerName `
    -v "${workspaceDir}:/app" `
    -w /app `
    -e NODE_ENV=development `
    $imageName `
    sh -c $dockerCmd

$exitCode = $LASTEXITCODE

if ($exitCode -eq 0) {
    Write-Host "`n⚡ Execution succeeded!" -ForegroundColor Green
} else {
    Write-Host "`n❌ Execution failed with exit code $exitCode" -ForegroundColor Red
}

exit $exitCode
