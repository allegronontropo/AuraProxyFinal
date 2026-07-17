# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat

# Copy all source files
COPY . .

# Install dependencies
RUN npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm install --maxsockets=3

# Generate prisma client
RUN npm run db:generate

# Next.js telemetry disable
ENV NEXT_TELEMETRY_DISABLED=1

# Build the dashboard app and its dependencies
RUN npx turbo run build --filter=@aura/dashboard...

# Stage 2: Production
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy root package files
COPY package*.json ./
COPY turbo.json ./

# Copy built artifacts from the dashboard
COPY --from=builder --chown=nextjs:nodejs /app/apps/dashboard/public ./apps/dashboard/public

# Set correct permission for prerender cache
RUN mkdir -p apps/dashboard/.next/cache
RUN chown -R nextjs:nodejs apps/dashboard/.next

# Copy the standalone output if output: 'standalone' is set, or just use next start
COPY --from=builder --chown=nextjs:nodejs /app/apps/dashboard/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/dashboard/.next/static ./apps/dashboard/.next/static

USER nextjs

EXPOSE 3001
ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

# Run the standalone server
CMD ["node", "apps/dashboard/server.js"]
