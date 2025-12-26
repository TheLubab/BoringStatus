# 1. Base
FROM oven/bun:1-alpine AS base
WORKDIR /app

# 2. Build Dependencies
FROM base AS build-deps
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

# 4. Builder
FROM base AS builder
COPY --from=build-deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
RUN bun run build

# 5. Runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# Setup user
RUN adduser -D -u 1001 -G bun bobo

# A. Copy production node_modules
COPY --from=build-deps --chown=bobo:bun /app/node_modules ./node_modules

# B. Copy the built artifact
COPY --from=builder --chown=bobo:bun /app/dist ./dist
COPY --chown=bobo:bun server.ts ./server.ts

USER bobo
EXPOSE 3000

CMD ["bun", "run", "server.ts"]
