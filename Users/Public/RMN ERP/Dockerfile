# Stage 1: Build
FROM node:20-slim AS builder

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

# Copy configuration files
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc* ./

# Copy package/app manifests
COPY packages/*/package.json packages/
COPY apps/*/package.json apps/

# Install dependencies
RUN pnpm install --frozen-lockfile || pnpm install

# Copy source code
COPY . .

# Build all packages and apps
RUN pnpm run build

# Stage 2: Production runtime
FROM node:20-slim AS runner

WORKDIR /app

RUN groupadd -r rmn && useradd -r -g rmn rmn

COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER rmn

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

CMD ["node", "apps/api/dist/index.js"]
