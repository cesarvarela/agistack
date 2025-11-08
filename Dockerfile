# syntax=docker/dockerfile:1

# Build stage
FROM node:20 AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/frontend/package.json ./apps/frontend/
COPY apps/control-plane/package.json ./apps/control-plane/
COPY apps/agent/package.json ./apps/agent/
COPY packages/control-plane-api/package.json ./packages/control-plane-api/
COPY packages/control-plane-services/package.json ./packages/control-plane-services/
COPY packages/node-api/package.json ./packages/node-api/
COPY packages/node-services/package.json ./packages/node-services/
COPY packages/db/package.json ./packages/db/
COPY packages/tool-metadata/package.json ./packages/tool-metadata/
COPY packages/typescript-config/package.json ./packages/typescript-config/

# Install dependencies (including native modules)
# Skip husky git hooks installation in Docker
RUN HUSKY=0 pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build Next.js frontend with hardcoded control plane port
RUN cd apps/frontend && NEXT_PUBLIC_CP_PORT=14002 pnpm build

# Production stage
FROM node:20

# Install pnpm and PM2
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate && \
    npm install -g pm2

WORKDIR /app

# Copy everything from builder stage (includes built frontend and all dependencies)
COPY --from=builder /app ./

# Create data directory for SQLite database
RUN mkdir -p /app/data
VOLUME /app/data

# Copy PM2 ecosystem config and entrypoint script
COPY ecosystem.config.js ./
COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh


# Set environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:3000', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

ENTRYPOINT ["./entrypoint.sh"]
