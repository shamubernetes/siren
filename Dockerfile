# Build stage
FROM oven/bun:1@sha256:b86c67b531d87b4db11470d9b2bd0c519b1976eee6fcd71634e73abfa6230d2e AS builder

WORKDIR /app

# Copy dependency files
COPY package.json bun.lock ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN bun run build

# Verify build output exists
RUN test -d .output || (echo "Build output directory .output not found" && exit 1)

# Runtime stage
FROM oven/bun:1-slim@sha256:5d5863f35ad9b3acceee8dc134fb2b89f07831129eaeec81af2b19a23dabe3e0 AS runner

WORKDIR /app

# Port configuration (can be overridden at build time with --build-arg PORT=8080)
ARG PORT=3000
ENV PORT=${PORT}

# Set production environment
ENV NODE_ENV=production

# Copy built application from builder
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/package.json ./package.json

EXPOSE ${PORT}

# Run the Nitro server
CMD ["node", ".output/server/index.mjs"]
