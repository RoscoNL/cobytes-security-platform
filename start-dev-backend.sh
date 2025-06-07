#!/bin/bash

echo "Starting backend in development mode without database..."

cd backend

# Set environment variables for dev mode
export SKIP_DB=true
export SKIP_REDIS=true
export NODE_ENV=development
export PORT=3001
export JWT_SECRET=dev-secret-change-in-production
export JWT_REFRESH_SECRET=dev-refresh-secret-change-in-production

# Kill any existing backend process on port 3001
lsof -ti:3001 | xargs kill -9 2>/dev/null

# Start the backend
npm run dev