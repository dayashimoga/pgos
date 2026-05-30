# Production Dockerfile for @pgos/api
FROM node:20-slim AS base

# Install pnpm globally
RUN npm install -g pnpm@9.1.0

WORKDIR /app

# Copy workspace and base configurations
COPY pnpm-workspace.yaml package.json turbo.json tsconfig.base.json ./

# Copy all package.json files to optimize dependency caching
COPY packages/core/package.json ./packages/core/
COPY packages/context-engine/package.json ./packages/context-engine/
COPY packages/model-adapters/package.json ./packages/model-adapters/
COPY packages/recovery-engine/package.json ./packages/recovery-engine/
COPY packages/validation-engine/package.json ./packages/validation-engine/
COPY packages/hallucination-detector/package.json ./packages/hallucination-detector/
COPY packages/architecture-guard/package.json ./packages/architecture-guard/
COPY packages/observability/package.json ./packages/observability/
COPY packages/semantic-git/package.json ./packages/semantic-git/
COPY packages/memory-engine/package.json ./packages/memory-engine/
COPY packages/token-optimizer/package.json ./packages/token-optimizer/
COPY apps/api/package.json ./apps/api/
COPY apps/cli/package.json ./apps/cli/
COPY apps/dashboard/package.json ./apps/dashboard/

# Install dependencies
RUN pnpm install --frozen-lockfile --ignore-scripts || pnpm install --ignore-scripts

# Copy source code
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

# Build all workspace packages and api app
RUN pnpm run build --filter=@pgos/api...

# Production Runner Stage
FROM node:20-slim AS runner
WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm@9.1.0

# Copy built outputs and runtime dependencies
COPY --from=base /app/package.json ./package.json
COPY --from=base /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/packages ./packages
COPY --from=base /app/apps/api ./apps/api

# Set production environment
ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000

# Start server
CMD ["pnpm", "--filter", "@pgos/api", "start"]
