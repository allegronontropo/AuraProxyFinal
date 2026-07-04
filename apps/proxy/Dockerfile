# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Install turbo
RUN npm install -g turbo

# Copy all source files
COPY . .

# Install dependencies
RUN npm install

# Generate prisma client
RUN npm run db:generate

# Build the proxy app and its dependencies
RUN npx turbo run build --filter=@aura/proxy...

# Stage 2: Production
FROM node:20-alpine AS runner

WORKDIR /app

# Set NODE_ENV to production
ENV NODE_ENV=production

# Copy root package.json and package-lock.json
COPY package*.json ./

# Copy packages
COPY packages/ ./packages/

# Copy the built proxy app
COPY --from=builder /app/apps/proxy/package.json ./apps/proxy/
COPY --from=builder /app/apps/proxy/dist ./apps/proxy/dist

# Install production dependencies only
RUN npm install --omit=dev

# Generate prisma client for production
RUN npm run db:generate

EXPOSE 4000

# Start the proxy
CMD ["node", "apps/proxy/dist/src/main.js"]
