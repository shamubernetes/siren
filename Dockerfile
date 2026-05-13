# Build stage
FROM oven/bun:1@sha256:e10577f0db68676a7024391c6e5cb4b879ebd17188ab750cf10024a6d700e5c4 AS builder

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
FROM oven/bun:1-slim@sha256:7e8ed3961db1cdedf17d516dda87948cfedbd294f53bf16462e5b57ed3fff0f1 AS runner

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
