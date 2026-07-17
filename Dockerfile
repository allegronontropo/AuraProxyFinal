# Stage 1: Build
FROM node:20-slim AS builder

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl

WORKDIR /app



# Copy all source files
COPY . .

# Install dependencies
RUN npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm install --maxsockets=3

# Generate prisma client
RUN npm run db:generate

# Build the proxy app and its dependencies
RUN npx turbo run build --filter=@aura/proxy...

# Stage 2: Production
FROM node:20-slim AS runner

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl

WORKDIR /app


# Set NODE_ENV to production
ENV NODE_ENV=production

# Copy root package.json and package-lock.json
COPY package*.json ./

# Copy packages from the builder stage (so we get the compiled dist/ folders)
COPY --from=builder /app/packages/ ./packages/

# Copy the built proxy app
COPY --from=builder /app/apps/proxy/package.json ./apps/proxy/
COPY --from=builder /app/apps/proxy/dist ./apps/proxy/dist

# Also copy package.json for other apps so npm workspaces doesn't complain about missing directories
COPY --from=builder /app/apps/dashboard/package.json ./apps/dashboard/
COPY --from=builder /app/apps/landing/package.json ./apps/landing/

# Install production dependencies only
RUN npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm install --omit=dev --maxsockets=3

# Generate prisma client for production
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

EXPOSE 3000

# Start the proxy (run migrations first)
CMD ["sh", "-c", "npx prisma migrate deploy --schema=packages/db/prisma/schema.prisma && node apps/proxy/dist/src/main.js"]
