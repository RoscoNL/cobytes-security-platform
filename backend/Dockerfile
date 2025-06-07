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

# Copy CA certificate for database SSL connection (if it exists)
# The certificate will be created/updated during deployment
RUN echo "-----BEGIN CERTIFICATE-----" > ca-certificate.crt && \
    echo "MIIEUDCCArigAwIBAgIUUP35IL7OQax1KToYmafUVf5Y12owDQYJKoZIhvcNAQEM" >> ca-certificate.crt && \
    echo "BQAwQDE+MDwGA1UEAww1N2U1NTc5ZTMtMWEzMi00ZWQ3LWE0Y2QtZjA5MmE5NjUz" >> ca-certificate.crt && \
    echo "M2FiIEdFTiAxIFByb2plY3QgQ0EwHhcNMjUwNjA2MTk0ODUyWhcNMzUwNjA0MTk0" >> ca-certificate.crt && \
    echo "ODUyWjBAMT4wPAYDVQQDDDU3ZTU1NzllMy0xYTMyLTRlZDctYTRjZC1mMDkyYTk2" >> ca-certificate.crt && \
    echo "NTMzYWIgR0VOIDEgUHJvamVjdCBDQTCCAaIwDQYJKoZIhvcNAQEBBQADggGPADCC" >> ca-certificate.crt && \
    echo "AYoCggGBAK8q/OfhbmsxtZlk8jvz8bgoHO8azVyJlWIKG2CFB3Yn8N1eJWA4cuFd" >> ca-certificate.crt && \
    echo "xQs0bQQKKO9SWq7YF+4IzLbZmne7SuPSz8HpC2+ebbjxwPZ9ho2eMAtINa4yPElW" >> ca-certificate.crt && \
    echo "QFQE4UW08Z78IY6TnXbXky/AWTC7u5TeBMcA44gC0r+GyE9NLPj0Pzau0TvHqDAy" >> ca-certificate.crt && \
    echo "9NjOT4R0ZQYCuo5Wor0VsW8QW64pgKh+SZyl8DPyBmFWst1IE6wJjIIxMi6ehEaB" >> ca-certificate.crt && \
    echo "IMXI6Uil+2iKgHsfRadkhdEHMQ08jUT35vBj7QO990OJ2BNbUcvDeJlj3Y+J9a2S" >> ca-certificate.crt && \
    echo "OYb8Q07+a7DVHnh20KX9PI9gksDIN8XDo7a3fGiY0RRBNKfHdulUalysNroRGGwF" >> ca-certificate.crt && \
    echo "dLLmHAhRB/HTUkIzgNnPD7ISS99AW34XSAjtKz8AOP5MIy9+hyKXAQ1Tp6iOPKnI" >> ca-certificate.crt && \
    echo "QIOtYoQF9ML81YvGkALO7Gh71SEn+mtBnPYq6w4WE/g9ujCW1lJy6V0VdHd3QckX" >> ca-certificate.crt && \
    echo "2GZzdlw7fQIDAQABo0IwQDAdBgNVHQ4EFgQUsDzrCE5+6Q21vLCayD9F8ZF1Rysw" >> ca-certificate.crt && \
    echo "EgYDVR0TAQH/BAgwBgEB/wIBADALBgNVHQ8EBAMCAQYwDQYJKoZIhvcNAQEMBQAD" >> ca-certificate.crt && \
    echo "ggGBADX+og0lST16A1mHcNwpxI9eAE7bH3EprNWowbvhS1oiMQIkbjdKWgjU03Gs" >> ca-certificate.crt && \
    echo "eEY1U0MUvX4nVQGPOBr5g8+VBrtfxvjH703uPM2//VZ2V9HMCfSd5QfS/dvXgdVb" >> ca-certificate.crt && \
    echo "Gfe9IIbeJ9R5kRS3nU+3/qWUKfh50BS1Vl1qEEnrHySQBVjbKdYmCipwwTSWaRKq" >> ca-certificate.crt && \
    echo "CN9PnUUEp3E+bj1AhLmdz/8D1N+YWxOp58Q7sAy9bCRFd+DRRHZ6UJu4VjTASiBy" >> ca-certificate.crt && \
    echo "6XJ5z4rMlprpL/I6PqhhoEATeytri8HFj7oKNoyBC0afHvOL3pZKrOOt1LA2723q" >> ca-certificate.crt && \
    echo "+ns/GwpUsCJJx7bNdnUjDRZV0z3esRXiuuSION3x9En6ekeACuV0bGdXQFi2ZCo9" >> ca-certificate.crt && \
    echo "WFQvRLXNvYbfIjojK/7K6qBGRxBEXjsA/1afMrMy6IboYnhnK3uc4RrpvcOf+X2k" >> ca-certificate.crt && \
    echo "lWIEflxqdFO/JgMrvPhtzY+DfNyG890/BQ5ZeQv/ilmYHiYz/TlXUxyOaPJJ0oNe" >> ca-certificate.crt && \
    echo "YNBjuA==" >> ca-certificate.crt && \
    echo "-----END CERTIFICATE-----" >> ca-certificate.crt

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