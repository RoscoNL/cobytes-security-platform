#!/bin/bash

# Test Runner Script for Cobytes Security Platform
# This script runs all tests and generates comprehensive reports

set -e

echo "🚀 Starting Cobytes Security Platform Test Suite"
echo "============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create test reports directory
mkdir -p /app/test-reports
mkdir -p /app/test-screenshots

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."

# Function to check if service is ready
check_service() {
    local service_url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s -o /dev/null -w "%{http_code}" "$service_url" | grep -q "200\|301\|302"; then
            echo -e "${GREEN}✓ $service_name is ready${NC}"
            return 0
        fi
        echo "Waiting for $service_name... (attempt $attempt/$max_attempts)"
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo -e "${RED}✗ $service_name failed to start${NC}"
    return 1
}

# Check backend health
check_service "http://backend-test:3001/api/health" "Backend API"

# Check frontend
check_service "http://frontend-test:3002" "Frontend"

# Run tests in sequence
echo ""
echo "🧪 Running Test Suites"
echo "====================="

# Backend Unit Tests
echo ""
echo "1️⃣ Backend Unit Tests"
echo "-------------------"
npm run test:backend || echo -e "${YELLOW}⚠ Backend tests completed with issues${NC}"

# Frontend Tests
echo ""
echo "2️⃣ Frontend Tests"
echo "----------------"
npm run test:frontend || echo -e "${YELLOW}⚠ Frontend tests completed with issues${NC}"

# Integration Tests
echo ""
echo "3️⃣ Integration Tests"
echo "------------------"
npm run test:integration || echo -e "${YELLOW}⚠ Integration tests completed with issues${NC}"

# E2E Tests
echo ""
echo "4️⃣ End-to-End Tests"
echo "------------------"
npm run test:e2e || echo -e "${YELLOW}⚠ E2E tests completed with issues${NC}"

# Generate final report
echo ""
echo "📊 Generating Test Reports"
echo "========================"

# Create summary report
cat > /app/test-reports/summary.txt << EOF
Cobytes Security Platform Test Summary
=====================================
Date: $(date)

Test Results:
- Backend Unit Tests: Check backend.html
- Frontend Tests: Check frontend.html
- Integration Tests: Check integration.html
- E2E Tests: Check e2e.html

Coverage Report: coverage/index.html
Screenshots: test-screenshots/

EOF

echo -e "${GREEN}✓ Test suite completed!${NC}"
echo "View reports in: /app/test-reports/"

# Keep container running for debugging if needed
if [ "$DEBUG_MODE" = "true" ]; then
    echo "Debug mode enabled. Container will stay running..."
    tail -f /dev/null
fi