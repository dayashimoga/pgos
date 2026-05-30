#!/bin/bash
# ============================================================
# PGOS Docker Test Runner (Bash / WSL / Linux / macOS)
# Runs the full PGOS test suite inside Docker.
# No local Node.js, pnpm, or npm required.
#
# Usage:
#   ./docker-test.sh                   # Run all tests (context-engine + core)
#   ./docker-test.sh --filter core     # Run only @pgos/core tests
#   ./docker-test.sh --coverage        # Run with coverage report
#   ./docker-test.sh --build           # TypeScript compile check only
#   ./docker-test.sh --rebuild         # Force rebuild image
#   ./docker-test.sh --all             # Run all workspace package tests
# ============================================================

set -e

IMAGE_NAME="pgos-test-runner"
CONTAINER_NAME="pgos-test-run"
DOCKERFILE="Dockerfile.test"

# Parse args
FILTER=""
MODE="default"
REBUILD=false
EXTRA_ARGS=""

while [[ "$#" -gt 0 ]]; do
    case $1 in
        --filter)     FILTER="$2"; MODE="filter"; shift ;;
        --coverage)   MODE="coverage" ;;
        --build)      MODE="build" ;;
        --rebuild)    REBUILD=true ;;
        --watch)      MODE="watch" ;;
        --all)        MODE="all" ;;
        *)            EXTRA_ARGS="$EXTRA_ARGS $1" ;;
    esac
    shift
done

echo ""
echo "============================================================"
echo " PGOS Docker Test Runner (Bash)"
echo " Workspace: $(pwd)"
echo "============================================================"
echo ""

# ── Check Docker ──────────────────────────────────────────────
if ! command -v docker &>/dev/null; then
    echo "[ERROR] Docker is not installed or not in PATH."
    echo "        Install Docker: https://www.docker.com/products/docker-desktop"
    exit 1
fi

if ! docker info &>/dev/null; then
    echo "[ERROR] Docker daemon is not running. Start it first."
    exit 1
fi

echo "[OK] Docker is available"

# ── Remove old container if exists ───────────────────────────
if docker ps -a --format "{{.Names}}" | grep -q "^${CONTAINER_NAME}$"; then
    echo "[INFO] Removing existing container '$CONTAINER_NAME'..."
    docker rm -f "$CONTAINER_NAME" >/dev/null
fi

# ── Build image ──────────────────────────────────────────────
BUILD_FLAGS=""
if [ "$REBUILD" = "true" ]; then
    BUILD_FLAGS="--no-cache"
    echo "[INFO] Force-rebuilding image (--no-cache)..."
else
    echo "[INFO] Building image '$IMAGE_NAME' (using cached layers where possible)..."
fi

BUILD_START=$(date +%s)
docker build $BUILD_FLAGS -f "$DOCKERFILE" --target test -t "$IMAGE_NAME" .
BUILD_EXIT=$?
BUILD_END=$(date +%s)
BUILD_DURATION=$((BUILD_END - BUILD_START))

if [ "$BUILD_EXIT" -ne 0 ]; then
    echo ""
    echo "[FAIL] Docker image build failed (exit $BUILD_EXIT)"
    exit "$BUILD_EXIT"
fi

echo "[OK] Image built in ${BUILD_DURATION}s"
echo ""

# ── Compose test command ──────────────────────────────────────
case "$MODE" in
    build)
        TEST_CMD="pnpm --filter @pgos/core --filter @pgos/context-engine typecheck"
        echo "[MODE] TypeScript compile check"
        ;;
    coverage)
        TEST_CMD="pnpm --filter @pgos/core --filter @pgos/context-engine run test -- --coverage --reporter=verbose"
        echo "[MODE] Test with coverage"
        ;;
    watch)
        TEST_CMD="pnpm --filter @pgos/context-engine run test -- --watch"
        echo "[MODE] Test watch mode"
        ;;
    filter)
        TEST_CMD="pnpm --filter @pgos/${FILTER} run test -- --reporter=verbose"
        echo "[MODE] Filtered test: @pgos/${FILTER}"
        ;;
    all)
        TEST_CMD="pnpm test --reporter=verbose"
        echo "[MODE] All packages test"
        ;;
    *)
        TEST_CMD="pnpm --filter @pgos/core --filter @pgos/context-engine run test -- --reporter=verbose"
        echo "[MODE] Default: @pgos/core + @pgos/context-engine"
        ;;
esac

echo "[CMD]  $TEST_CMD"
echo ""

# ── Run tests ─────────────────────────────────────────────────
TEST_START=$(date +%s)

docker run --rm \
    --name "$CONTAINER_NAME" \
    -e NODE_ENV=test \
    -e CI=true \
    -e FORCE_COLOR=1 \
    "$IMAGE_NAME" \
    sh -c "$TEST_CMD $EXTRA_ARGS"

EXIT_CODE=$?
TEST_END=$(date +%s)
TEST_DURATION=$((TEST_END - TEST_START))

echo ""
echo "============================================================"
if [ "$EXIT_CODE" -eq 0 ]; then
    echo " [PASS] All tests passed in ${TEST_DURATION}s"
else
    echo " [FAIL] Tests failed (exit $EXIT_CODE) after ${TEST_DURATION}s"
fi
echo "============================================================"
echo ""

exit "$EXIT_CODE"
