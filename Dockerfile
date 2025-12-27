# Build stage
FROM oven/bun:1 AS builder

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
FROM oven/bun:1-slim AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000

# Copy built application from builder
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/package.json ./package.json

# Expose port
EXPOSE 3000

# Run the Nitro server
CMD ["node", ".output/server/index.mjs"]
