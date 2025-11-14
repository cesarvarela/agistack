# syntax=docker/dockerfile:1

# Build stage
FROM node:22-alpine AS builder

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/frontend/package.json ./apps/frontend/
COPY apps/control-plane/package.json ./apps/control-plane/
COPY apps/node/package.json ./apps/node/
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

# Build Next.js frontend (port configured at runtime via /api/config)
RUN cd apps/frontend && DOCKER_BUILD=true pnpm build

# Production stage
FROM node:22-alpine

# Install pnpm and PM2
RUN apk add --no-cache tini && \
    corepack enable && corepack prepare pnpm@9.0.0 --activate && \
    npm install -g pm2

WORKDIR /app

# Copy standalone Next.js output (minimal runtime)
COPY --from=builder /app/apps/frontend/.next/standalone ./
COPY --from=builder /app/apps/frontend/.next/static ./apps/frontend/.next/static

# Copy other apps and packages (control-plane and node still need full setup)
COPY --from=builder /app/apps/control-plane ./apps/control-plane
COPY --from=builder /app/apps/node ./apps/node
COPY --from=builder /app/packages ./packages

# Copy only necessary node_modules for non-frontend apps
COPY --from=builder /app/node_modules ./node_modules

# Clean up unnecessary dependencies and platform binaries
RUN rm -rf node_modules/.pnpm/@next+swc-linux-arm64-gnu* && \
    rm -rf node_modules/.pnpm/@img+sharp-libvips-linux-arm64@* && \
    rm -rf /root/.npm /root/.cache

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
