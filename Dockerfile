# Build stage
FROM oven/bun:1@sha256:e90cdbaf9ccdb3d4bd693aa335c3310a6004286a880f62f79b18f9b1312a8ec3 AS builder

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
FROM oven/bun:1-slim@sha256:6111acec4c5a703f2069d6e681967c047920ff2883e7e5a5e64f4ac95ddeb27f AS runner

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
