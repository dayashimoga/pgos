#!/usr/bin/env bash
# ====================================================================
# Project Guardian OS (PGOS) — Zero-Install Universal Client CLI (Unix/macOS)
# Drop this script into any project root to instantly run PGOS engines.
# ====================================================================

COMMAND=${1:-"help"}
EXTRA_ARGS=${@:2}

IMAGE_NAME="node:20-slim"
CONTAINER_NAME="pgos-client-runner"
PGOS_HOME="/h/pgos"  # Home directory of the cloned PGOS repository (update if path differs)
PROJECT_ROOT=$(pwd)

echo -e "\033[36m--------------------------------------------------------\033[0m"
echo -e "\033[36m [PGOS] Project Guardian OS -- Project Proxy CLI\033[0m"
echo -e "\033[36m--------------------------------------------------------\033[0m"

# 1. Check Docker status
if ! docker ps > /dev/null 2>&1; then
    echo -e "\033[31m[ERROR] Docker is not running. Please start Docker and retry.\033[0m"
    exit 1
fi

# 2. Determine command mapping
case "$COMMAND" in
    "init")
        echo -e "\033[33m[INIT] Initializing PGOS configurations in $PROJECT_ROOT...\033[0m"
        DOCKER_CMD="pnpm --filter @pgos/cli start -- init --root-path /project"
        ;;
    "validate")
        echo -e "\033[33m[VALIDATE] Running complete PGOS validation suite...\033[0m"
        DOCKER_CMD="pnpm --filter @pgos/cli start -- validate --root-path /project"
        ;;
    "context")
        echo -e "\033[33m[CONTEXT] Compiling L0-L4 workspace context package...\033[0m"
        DOCKER_CMD="pnpm --filter @pgos/cli start -- context compile --root-path /project"
        ;;
    "docs")
        echo -e "\033[33m[DOCS] Compiling 20-folder master documentation set...\033[0m"
        DOCKER_CMD="NODE_ENV=production node generate-docs.js /project"
        ;;
    "snapshot")
        echo -e "\033[33m[SNAPSHOT] Creating point-in-time snapshot checkpoint...\033[0m"
        DOCKER_CMD="pnpm --filter @pgos/cli start -- snapshot create --root-path /project $EXTRA_ARGS"
        ;;
    "rollback")
        echo -e "\033[33m[ROLLBACK] Restoring state to target stable snapshot...\033[0m"
        DOCKER_CMD="pnpm --filter @pgos/cli start -- recovery rollback --root-path /project $EXTRA_ARGS"
        ;;
    *)
        echo "Usage: ./pgos.sh <command> [args]"
        echo ""
        echo "Available Commands:"
        echo "  init                 Initialize .guardian/ rules and config structures"
        echo "  validate             Run completeness, anti-pattern, and dependency validation"
        echo "  context              Compile optimized active context file for LLM models"
        echo "  docs                 Synthesize C4 diagrams and generate 20-folder master docs"
        echo "  snapshot             Capture code, context, and test metrics before prompt runs"
        echo "  rollback --id id     Revert whole codebase state to specified snapshot"
        exit 0
        ;;
esac

# 3. Clean stale containers
docker rm -f $CONTAINER_NAME > /dev/null 2>&1

# 4. Launch runner mounting both directories
echo -e "\033[33mMounting PGOS workspace and project target...\033[0m"
docker run --rm \
    --name $CONTAINER_NAME \
    -v "${PGOS_HOME}:/app" \
    -v "${PROJECT_ROOT}:/project" \
    -w /app \
    -e NODE_ENV=production \
    $IMAGE_NAME \
    sh -c "npm install -g pnpm@9.1.0 --silent && $DOCKER_CMD"

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo -e "\n\033[32m[SUCCESS] Operation completed successfully!\033[0m"
else
    echo -e "\n\033[31m[ERROR] Operation failed with exit code $EXIT_CODE\033[0m"
fi

exit $EXIT_CODE
