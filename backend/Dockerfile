# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install TypeScript globally first
RUN npm install -g typescript

# Install all dependencies (including devDependencies for build)
RUN npm ci --include=dev

# Verify TypeScript is installed
RUN tsc --version

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install production dependencies
RUN npm ci --omit=dev

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Copy source for path resolution (needed for tsconfig-paths)
COPY --from=builder /app/src ./src

# Create necessary directories
RUN mkdir -p uploads logs && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3001

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application with tsconfig-paths
CMD ["node", "-r", "tsconfig-paths/register", "dist/index.js"]