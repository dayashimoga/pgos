# Production Dockerfile for @pgos/dashboard Next.js App
FROM node:20-slim AS base

# Install pnpm globally
RUN npm install -g pnpm@9.1.0

WORKDIR /app

# Copy workspace and base configurations
COPY pnpm-workspace.yaml package.json turbo.json tsconfig.base.json ./

# Copy package.json files for optimized dependency caching
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
COPY apps/dashboard/package.json ./apps/dashboard/
COPY apps/api/package.json ./apps/api/
COPY apps/cli/package.json ./apps/cli/

# Install dependencies
RUN pnpm install --frozen-lockfile --ignore-scripts || pnpm install --ignore-scripts

# Copy source code
COPY packages/ ./packages/
COPY apps/dashboard/ ./apps/dashboard/

# Build Next.js app
RUN pnpm run build --filter=@pgos/dashboard

# Production Runner Stage
FROM node:20-slim AS runner
WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm@9.1.0

# Copy Next.js public assets, built client/server files, and production modules
COPY --from=base /app/package.json ./package.json
COPY --from=base /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/packages ./packages
COPY --from=base /app/apps/dashboard ./apps/dashboard

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# Start Next.js server
CMD ["pnpm", "--filter", "@pgos/dashboard", "start"]
