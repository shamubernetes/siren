# Build stage
FROM oven/bun:1@sha256:87416c977a612a204eb54ab9f3927023c2a3c971f4f345a01da08ea6262ae30e AS builder

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
FROM oven/bun:1-slim@sha256:d3c7094c144dd3975d183a4dbc4ec0a764223995bff73290d983edb47043a75f AS runner

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
