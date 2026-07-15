# Stage 1: Build
FROM node:20-slim AS builder

WORKDIR /app



# Copy all source files
COPY . .

# Install dependencies
RUN npm install

# Generate prisma client
RUN npm run db:generate

# Build the proxy app and its dependencies
RUN npx turbo run build --filter=@aura/proxy...

# Stage 2: Production
FROM node:20-slim AS runner

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

# Install production dependencies only
RUN npm install --omit=dev

# Generate prisma client for production
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

EXPOSE 3000

# Start the proxy (run migrations first)
CMD ["sh", "-c", "npx prisma migrate deploy --schema=packages/db/prisma/schema.prisma && node apps/proxy/dist/src/main.js"]
